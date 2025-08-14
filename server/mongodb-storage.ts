import { connectDB } from "./mongodb";
import { 
  User as UserModel, 
  Category as CategoryModel, 
  Item as ItemModel, 
  Message as MessageModel,
  Conversation as ConversationModel,
  Wishlist as WishlistModel,
  type User,
  type Category,
  type Item,
  type ItemWithDetails,
  type Message,
  type MessageWithUsers,
  type Conversation,
  type InsertItem,
  type InsertMessage,
} from "@shared/mongodb-schemas";
import { Types } from 'mongoose';

export interface IStorage {
  // User operations for email/password auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(name: string, emoji: string): Promise<Category>;
  
  // Item operations
  getItems(filters?: {
    categoryId?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sellerId?: string;
  }): Promise<ItemWithDetails[]>;
  getItem(id: string): Promise<ItemWithDetails | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string, sellerId: string): Promise<boolean>;
  incrementItemViews(id: string): Promise<void>;
  
  // Message operations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversationMessages(conversationId: string): Promise<MessageWithUsers[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Wishlist operations
  addToWishlist(userId: string, itemId: string): Promise<void>;
  removeFromWishlist(userId: string, itemId: string): Promise<void>;
  getUserWishlist(userId: string): Promise<ItemWithDetails[]>;
  isItemInWishlist(userId: string, itemId: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  private initialized = false;
  
  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await connectDB();
      await this.initializeCategories();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeConnection();
    }
  }

  private async initializeCategories() {
    try {
      const count = await CategoryModel.countDocuments();
      if (count === 0) {
        const defaultCategories = [
          { name: 'Books & Textbooks', emoji: '📚' },
          { name: 'Electronics', emoji: '💻' },
          { name: 'Furniture', emoji: '🪑' },
          { name: 'Clothing', emoji: '👕' },
          { name: 'Sports & Recreation', emoji: '⚽' },
          { name: 'Other', emoji: '📦' },
        ];
        
        await CategoryModel.insertMany(defaultCategories);
        console.log('Categories initialized');
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (!Types.ObjectId.isValid(id)) return undefined;
      const user = await UserModel.findById(id).lean();
      return user ? { ...user, id: user._id.toString() } as User : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email }).lean();
      return user ? { ...user, id: user._id.toString() } as User : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const user = new UserModel(userData);
      const savedUser = await user.save();
      return { ...savedUser.toObject(), id: savedUser._id.toString() } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async upsertUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const user = await UserModel.findOneAndUpdate(
        { email: userData.email },
        { $set: userData },
        { upsert: true, new: true, lean: true }
      );
      return { ...user, id: user._id.toString() } as User;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    try {
      await this.ensureInitialized();
      const categories = await CategoryModel.find().lean();
      return categories.map(cat => ({ ...cat, id: cat._id.toString() } as Category));
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async createCategory(name: string, emoji: string): Promise<Category> {
    try {
      const category = new CategoryModel({ name, emoji });
      const savedCategory = await category.save();
      return { ...savedCategory.toObject(), id: savedCategory._id.toString() } as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Item operations
  async getItems(filters?: {
    categoryId?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sellerId?: string;
  }): Promise<ItemWithDetails[]> {
    try {
      const query: any = { isActive: true };

      if (filters) {
        if (filters.categoryId && Types.ObjectId.isValid(filters.categoryId)) {
          query.categoryId = new Types.ObjectId(filters.categoryId);
        }
        if (filters.condition) {
          query.condition = filters.condition;
        }
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
          query.price = {};
          if (filters.minPrice !== undefined) {
            query.price.$gte = filters.minPrice.toString();
          }
          if (filters.maxPrice !== undefined) {
            query.price.$lte = filters.maxPrice.toString();
          }
        }
        if (filters.search) {
          query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
          ];
        }
        if (filters.sellerId && Types.ObjectId.isValid(filters.sellerId)) {
          query.sellerId = new Types.ObjectId(filters.sellerId);
        }
      }

      const items = await ItemModel.find(query)
        .populate('categoryId', 'name emoji')
        .populate('sellerId', 'firstName lastName email profileImageUrl')
        .sort({ createdAt: -1 })
        .lean();

      return items.map(item => ({
        ...item,
        id: item._id.toString(),
        categoryId: item.categoryId?.toString(),
        sellerId: item.sellerId._id.toString(),
        category: item.categoryId ? {
          id: item.categoryId._id.toString(),
          name: item.categoryId.name,
          emoji: item.categoryId.emoji,
          createdAt: item.categoryId.createdAt || new Date()
        } : undefined,
        seller: {
          id: item.sellerId._id.toString(),
          email: item.sellerId.email,
          firstName: item.sellerId.firstName,
          lastName: item.sellerId.lastName,
          profileImageUrl: item.sellerId.profileImageUrl,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as ItemWithDetails));
    } catch (error) {
      console.error('Error getting items:', error);
      return [];
    }
  }

  async getItem(id: string): Promise<ItemWithDetails | undefined> {
    try {
      if (!Types.ObjectId.isValid(id)) return undefined;
      
      const item = await ItemModel.findById(id)
        .populate('categoryId', 'name emoji')
        .populate('sellerId', 'firstName lastName email profileImageUrl')
        .lean();

      if (!item) return undefined;

      return {
        ...item,
        id: item._id.toString(),
        categoryId: item.categoryId?.toString(),
        sellerId: item.sellerId._id.toString(),
        category: item.categoryId ? {
          id: item.categoryId._id.toString(),
          name: item.categoryId.name,
          emoji: item.categoryId.emoji,
          createdAt: item.categoryId.createdAt || new Date()
        } : undefined,
        seller: {
          id: item.sellerId._id.toString(),
          email: item.sellerId.email,
          firstName: item.sellerId.firstName,
          lastName: item.sellerId.lastName,
          profileImageUrl: item.sellerId.profileImageUrl,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as ItemWithDetails;
    } catch (error) {
      console.error('Error getting item:', error);
      return undefined;
    }
  }

  async createItem(item: InsertItem): Promise<Item> {
    try {
      const itemData = {
        ...item,
        sellerId: new Types.ObjectId(item.sellerId),
        categoryId: item.categoryId ? new Types.ObjectId(item.categoryId) : undefined
      };
      
      const newItem = new ItemModel(itemData);
      const savedItem = await newItem.save();
      
      return {
        ...savedItem.toObject(),
        id: savedItem._id.toString(),
        categoryId: savedItem.categoryId?.toString(),
        sellerId: savedItem.sellerId.toString()
      } as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    try {
      if (!Types.ObjectId.isValid(id)) return undefined;
      
      const updateData = {
        ...updates,
        ...(updates.sellerId && { sellerId: new Types.ObjectId(updates.sellerId) }),
        ...(updates.categoryId && { categoryId: new Types.ObjectId(updates.categoryId) })
      };

      const item = await ItemModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, lean: true }
      );

      return item ? {
        ...item,
        id: item._id.toString(),
        categoryId: item.categoryId?.toString(),
        sellerId: item.sellerId.toString()
      } as Item : undefined;
    } catch (error) {
      console.error('Error updating item:', error);
      return undefined;
    }
  }

  async deleteItem(id: string, sellerId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(sellerId)) return false;
      
      const result = await ItemModel.deleteOne({ 
        _id: new Types.ObjectId(id), 
        sellerId: new Types.ObjectId(sellerId) 
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  async incrementItemViews(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) return;
      await ItemModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } catch (error) {
      console.error('Error incrementing item views:', error);
    }
  }

  // Message operations (simplified)
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) return [];
      
      const conversations = await ConversationModel.find({
        $or: [
          { participant1Id: new Types.ObjectId(userId) },
          { participant2Id: new Types.ObjectId(userId) }
        ]
      })
      .sort({ lastMessageAt: -1 })
      .lean();

      return conversations.map(conv => ({
        ...conv,
        id: conv._id.toString(),
        participant1Id: conv.participant1Id.toString(),
        participant2Id: conv.participant2Id.toString(),
        itemId: conv.itemId?.toString()
      } as Conversation));
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  async getConversationMessages(conversationId: string): Promise<MessageWithUsers[]> {
    try {
      if (!Types.ObjectId.isValid(conversationId)) return [];
      
      const conversation = await ConversationModel.findById(conversationId).lean();
      if (!conversation) return [];

      const messages = await MessageModel.find({
        $or: [
          { 
            fromUserId: conversation.participant1Id, 
            toUserId: conversation.participant2Id 
          },
          { 
            fromUserId: conversation.participant2Id, 
            toUserId: conversation.participant1Id 
          }
        ]
      })
      .populate('fromUserId', 'firstName lastName email profileImageUrl')
      .populate('toUserId', 'firstName lastName email profileImageUrl')
      .populate('itemId', 'title')
      .sort({ createdAt: 1 })
      .lean();

      return messages.map(msg => ({
        ...msg,
        id: msg._id.toString(),
        fromUserId: msg.fromUserId._id.toString(),
        toUserId: msg.toUserId._id.toString(),
        itemId: msg.itemId?._id.toString(),
        fromUser: {
          id: msg.fromUserId._id.toString(),
          email: msg.fromUserId.email,
          firstName: msg.fromUserId.firstName,
          lastName: msg.fromUserId.lastName,
          profileImageUrl: msg.fromUserId.profileImageUrl,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        toUser: {
          id: msg.toUserId._id.toString(),
          email: msg.toUserId.email,
          firstName: msg.toUserId.firstName,
          lastName: msg.toUserId.lastName,
          profileImageUrl: msg.toUserId.profileImageUrl,
          password: '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        item: msg.itemId ? {
          id: msg.itemId._id.toString(),
          title: msg.itemId.title,
          description: '',
          price: '0',
          condition: '',
          sellerId: '',
          images: [],
          isActive: true,
          allowNegotiation: false,
          pickupOnly: false,
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined
      } as MessageWithUsers));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const messageData = {
        ...message,
        fromUserId: new Types.ObjectId(message.fromUserId),
        toUserId: new Types.ObjectId(message.toUserId),
        itemId: message.itemId ? new Types.ObjectId(message.itemId) : undefined
      };

      const newMessage = new MessageModel(messageData);
      const savedMessage = await newMessage.save();

      // Create or update conversation
      const conversationData = {
        participant1Id: new Types.ObjectId(message.fromUserId),
        participant2Id: new Types.ObjectId(message.toUserId),
        itemId: message.itemId ? new Types.ObjectId(message.itemId) : undefined,
        lastMessageAt: new Date()
      };

      await ConversationModel.findOneAndUpdate(
        {
          $or: [
            {
              participant1Id: conversationData.participant1Id,
              participant2Id: conversationData.participant2Id,
              itemId: conversationData.itemId
            },
            {
              participant1Id: conversationData.participant2Id,
              participant2Id: conversationData.participant1Id,
              itemId: conversationData.itemId
            }
          ]
        },
        { $set: { lastMessageAt: conversationData.lastMessageAt } },
        { upsert: true, new: true }
      );

      return {
        ...savedMessage.toObject(),
        id: savedMessage._id.toString(),
        fromUserId: savedMessage.fromUserId.toString(),
        toUserId: savedMessage.toUserId.toString(),
        itemId: savedMessage.itemId?.toString()
      } as Message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) return;
      
      await MessageModel.updateMany(
        { toUserId: new Types.ObjectId(userId), isRead: false },
        { $set: { isRead: true } }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Wishlist operations
  async addToWishlist(userId: string, itemId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(itemId)) return;
      
      await WishlistModel.findOneAndUpdate(
        { 
          userId: new Types.ObjectId(userId), 
          itemId: new Types.ObjectId(itemId) 
        },
        { 
          userId: new Types.ObjectId(userId), 
          itemId: new Types.ObjectId(itemId) 
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(itemId)) return;
      
      await WishlistModel.deleteOne({
        userId: new Types.ObjectId(userId),
        itemId: new Types.ObjectId(itemId)
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }

  async getUserWishlist(userId: string): Promise<ItemWithDetails[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) return [];
      
      const wishlistItems = await WishlistModel.find({ userId: new Types.ObjectId(userId) })
        .populate({
          path: 'itemId',
          match: { isActive: true },
          populate: [
            { path: 'categoryId', select: 'name emoji' },
            { path: 'sellerId', select: 'firstName lastName email profileImageUrl' }
          ]
        })
        .lean();

      return wishlistItems
        .filter(entry => entry.itemId)
        .map(entry => ({
          ...entry.itemId,
          id: entry.itemId._id.toString(),
          categoryId: entry.itemId.categoryId?._id.toString(),
          sellerId: entry.itemId.sellerId._id.toString(),
          category: entry.itemId.categoryId ? {
            id: entry.itemId.categoryId._id.toString(),
            name: entry.itemId.categoryId.name,
            emoji: entry.itemId.categoryId.emoji,
            createdAt: entry.itemId.categoryId.createdAt || new Date()
          } : undefined,
          seller: {
            id: entry.itemId.sellerId._id.toString(),
            email: entry.itemId.sellerId.email,
            firstName: entry.itemId.sellerId.firstName,
            lastName: entry.itemId.sellerId.lastName,
            profileImageUrl: entry.itemId.sellerId.profileImageUrl,
            password: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        } as ItemWithDetails));
    } catch (error) {
      console.error('Error getting user wishlist:', error);
      return [];
    }
  }

  async isItemInWishlist(userId: string, itemId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(itemId)) return false;
      
      const entry = await WishlistModel.findOne({
        userId: new Types.ObjectId(userId),
        itemId: new Types.ObjectId(itemId)
      });
      
      return !!entry;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }
}

export const storage = new MongoStorage();