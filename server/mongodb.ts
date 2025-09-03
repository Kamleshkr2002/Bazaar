import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();



const MONGODB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI + "/campus-bazaar"
  : "";



// Global type declaration for caching MongoDB connection
declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  } | undefined;
}

// Connection state
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connected to MongoDB');
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { mongoose };