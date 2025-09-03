import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isEmailVerified: boolean;
  verificationOTP?: string;
  otpExpiry?: Date;
  resetPasswordOTP?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  googleId: { type: String, unique: true, sparse: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profileImageUrl: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  verificationOTP: { type: String },
  otpExpiry: { type: Date },
  resetPasswordOTP: { type: String },
  resetPasswordExpiry: { type: Date },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Category Schema
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  emoji?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  emoji: { type: String },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Item Schema
export interface IItem extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  price: string;
  condition: string;
  categoryId?: Types.ObjectId;
  sellerId: Types.ObjectId;
  images: string[];
  isActive: boolean;
  allowNegotiation: boolean;
  pickupOnly: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: String, required: true },
  condition: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
  allowNegotiation: { type: Boolean, default: false },
  pickupOnly: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Message Schema
export interface IMessage extends Document {
  _id: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  itemId?: Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Conversation Schema
export interface IConversation extends Document {
  _id: Types.ObjectId;
  participant1Id: Types.ObjectId;
  participant2Id: Types.ObjectId;
  itemId?: Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participant1Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participant2Id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
  lastMessageAt: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Wishlist Schema
export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { ret.id = ret._id.toString(); delete ret?._id; delete ret?.__v; return ret; } }
});

// Create compound index for wishlist
wishlistSchema.index({ userId: 1, itemId: 1 }, { unique: true });

// Models
export const User = model<IUser>('User', userSchema);
export const Category = model<ICategory>('Category', categorySchema);
export const Item = model<IItem>('Item', itemSchema);
export const Message = model<IMessage>('Message', messageSchema);
export const Conversation = model<IConversation>('Conversation', conversationSchema);
export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  profileImageUrl: z.string().optional(),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  condition: z.string().min(1, "Condition is required"),
  categoryId: z.string().optional(),
  sellerId: z.string().min(1, "Seller ID is required"),
  images: z.array(z.string()).default([]),
  allowNegotiation: z.boolean().default(false),
  pickupOnly: z.boolean().default(false),
});

export const insertMessageSchema = z.object({
  fromUserId: z.string().min(1, "From user ID is required"),
  toUserId: z.string().min(1, "To user ID is required"),
  itemId: z.string().optional(),
  content: z.string().min(1, "Message content is required"),
});

// Types
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Transform MongoDB documents to match expected interface
export interface User {
  id: string;
  email: string;
  password?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isEmailVerified: boolean;
  verificationOTP?: string;
  otpExpiry?: Date;
  resetPasswordOTP?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  price: string;
  condition: string;
  categoryId?: string;
  sellerId: string;
  images: string[];
  isActive: boolean;
  allowNegotiation: boolean;
  pickupOnly: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemWithDetails extends Item {
  category?: Category;
  seller: User;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface MessageWithUsers extends Message {
  fromUser: User;
  toUser: User;
  item?: Item;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  itemId?: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface WishlistEntry {
  id: string;
  userId: string;
  itemId: string;
  createdAt: Date;
}