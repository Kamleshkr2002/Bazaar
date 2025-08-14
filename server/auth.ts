import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import {
  User,
  LoginData,
  RegisterData,
  VerifyOTPData,
  ForgotPasswordData,
  ResetPasswordData,
  loginSchema,
  registerSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../shared/mongodb-schemas";
import MemoryStore from "memorystore";
import { emailService, OTPService } from "./email-service";
import { uploadProfileImage } from "./cloudinary";
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session configuration - using in-memory store for development
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const MemoryStoreConstructor = MemoryStore(session);
  const sessionStore = new MemoryStoreConstructor({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days as requested
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password auth
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (
            !user ||
            !user.password ||
            !(await comparePasswords(password, user.password))
          ) {
            return done(null, false, { message: "Invalid email or password" });
          }
          if (!user.isEmailVerified) {
            return done(null, false, {
              message: "Please verify your email before logging in",
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  // Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with Google ID
          let user = await storage.getUserByGoogleId(profile.id);

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          user = await storage.getUserByEmail(profile.emails![0].value);

          if (user) {
            // Link Google account to existing user
            user = await storage.updateUser(user.id, {
              googleId: profile.id,
              profileImageUrl:
                user.profileImageUrl || profile.photos![0]?.value,
            });
            return done(null, user);
          }

          // Create new user from Google profile
          const newUser = await storage.createUser({
            email: profile.emails![0].value,
            googleId: profile.id,
            firstName: profile.name!.givenName!,
            lastName: profile.name!.familyName!,
            profileImageUrl: profile.photos![0]?.value,
            isEmailVerified: true, // Google emails are pre-verified
          });

          return done(null, newUser);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint with profile image upload
  app.post(
    "/api/register",
    uploadProfileImage.single("profileImage"),
    async (req, res, next) => {
      try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: validation.error.issues,
          });
        }

        const { email, password, firstName, lastName } = validation.data;

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
        }

        // Get profile image URL from Cloudinary upload
        const profileImageUrl = req.file ? req.file.path : undefined;

        // Generate OTP for email verification
        const otp = OTPService.generateOTP(email);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Create user with hashed password and OTP
        const hashedPassword = await hashPassword(password);
        const user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImageUrl,
          isEmailVerified: false,
          verificationOTP: otp,
          otpExpiry,
        });

        // Send verification email
        const emailSent = await emailService.sendOTP(
          email,
          otp,
          "verification",
        );

        if (!emailSent) {
          console.error("Failed to send verification email");
          // Continue registration even if email fails
        }

        res.status(201).json({
          message:
            "Registration successful. Please check your email for verification code.",
          needsVerification: true,
          email: user.email,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json({
          user
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Google OAuth routes
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/dashboard");
    },
  );

  // Email verification endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const validation = verifyOTPSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { email, otp } = validation.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Check if OTP is valid and not expired
      if (!user.verificationOTP || !user.otpExpiry) {
        return res
          .status(400)
          .json({
            message: "No verification code found. Please request a new one.",
          });
      }

      if (user.otpExpiry < new Date()) {
        return res
          .status(400)
          .json({
            message: "Verification code has expired. Please request a new one.",
          });
      }

      if (user.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Verify the user
      await storage.updateUser(user.id, {
        isEmailVerified: true,s
        verificationOTP: undefined,
        otpExpiry: undefined,
      });

      res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new OTP
      const otp = OTPService.generateOTP(email);
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await storage.updateUser(user.id, {
        verificationOTP: otp,
        otpExpiry,
      });

      const emailSent = await emailService.sendOTP(email, otp, "verification");

      if (!emailSent) {
        return res
          .status(500)
          .json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { email } = validation.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          message: "If the email exists, a reset code has been sent.",
        });
      }

      // Generate reset OTP
      const otp = OTPService.generateOTP(email + "_reset");
      const resetPasswordExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await storage.updateUser(user.id, {
        resetPasswordOTP: otp,
        resetPasswordExpiry,
      });

      const emailSent = await emailService.sendOTP(email, otp, "reset");

      if (!emailSent) {
        console.error("Failed to send reset password email");
      }

      res.json({ message: "If the email exists, a reset code has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.issues,
        });
      }

      const { email, otp, newPassword } = validation.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      // Check if OTP is valid and not expired
      if (!user.resetPasswordOTP || !user.resetPasswordExpiry) {
        return res
          .status(400)
          .json({ message: "No reset code found. Please request a new one." });
      }

      if (user.resetPasswordExpiry < new Date()) {
        return res
          .status(400)
          .json({
            message: "Reset code has expired. Please request a new one.",
          });
      }

      if (user.resetPasswordOTP !== otp) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      // Update password and clear reset fields
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordOTP: undefined,
        resetPasswordExpiry: undefined,
      });

      res.json({
        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as User;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      isEmailVerified: user.isEmailVerified,
    });
  });
}

// Middleware to check if user is authenticated
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
