// Legacy PostgreSQL database configuration - now replaced with MongoDB
// This file is kept for compatibility but no longer used

import { connectDB } from './mongodb';

// Export MongoDB connection for backward compatibility
export const db = null; // No longer used
export const connectDatabase = connectDB;