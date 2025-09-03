import type { VercelRequest, VercelResponse } from '@vercel/node';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { MongoStorage } from '../../server/mongodb-storage';
import { loginSchema } from '../../shared/mongodb-schemas';

const storage = new MongoStorage();
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure passport for this serverless function
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (
          !user ||
          !user.password ||
          !(await comparePasswords(password, user.password))
        ) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        if (!user.isEmailVerified) {
          return done(null, false, {
            message: 'Please verify your email before logging in',
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const { email, password } = validation.data;
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.password || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Return user data (in a real app, you'd set up JWT here)
    res.status(200).json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}