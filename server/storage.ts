import {
  users,
  items,
  categories,
  messages,
  conversations,
  wishlist,
  type User,
  type UpsertUser,
  type Item,
  type ItemWithDetails,
  type Category,
  type Message,
  type MessageWithUsers,
  type Conversation,
  type InsertItem,
  type InsertMessage,
  type InsertConversation,
  type InsertWishlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, like, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations for email/password auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(name: string, emoji: string): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({ name, emoji })
      .returning();
    return category;
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
    let query = db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        price: items.price,
        condition: items.condition,
        categoryId: items.categoryId,
        sellerId: items.sellerId,
        images: items.images,
        isActive: items.isActive,
        allowNegotiation: items.allowNegotiation,
        pickupOnly: items.pickupOnly,
        views: items.views,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        category: categories,
        seller: users,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(users, eq(items.sellerId, users.id))
      .where(eq(items.isActive, true));

    if (filters?.categoryId) {
      query = query.where(eq(items.categoryId, filters.categoryId));
    }
    if (filters?.condition) {
      query = query.where(eq(items.condition, filters.condition));
    }
    if (filters?.minPrice) {
      query = query.where(sql`${items.price} >= ${filters.minPrice}`);
    }
    if (filters?.maxPrice) {
      query = query.where(sql`${items.price} <= ${filters.maxPrice}`);
    }
    if (filters?.search) {
      query = query.where(
        or(
          ilike(items.title, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`)
        )
      );
    }
    if (filters?.sellerId) {
      query = query.where(eq(items.sellerId, filters.sellerId));
    }

    query = query.orderBy(desc(items.createdAt));

    const results = await query;
    return results.map(result => ({
      ...result,
      category: result.category || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
      seller: result.seller!,
    }));
  }

  async getItem(id: string): Promise<ItemWithDetails | undefined> {
    const [result] = await db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        price: items.price,
        condition: items.condition,
        categoryId: items.categoryId,
        sellerId: items.sellerId,
        images: items.images,
        isActive: items.isActive,
        allowNegotiation: items.allowNegotiation,
        pickupOnly: items.pickupOnly,
        views: items.views,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        category: categories,
        seller: users,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(users, eq(items.sellerId, users.id))
      .where(eq(items.id, id));

    if (!result) return undefined;

    return {
      ...result,
      category: result.category || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
      seller: result.seller!,
    };
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const [updatedItem] = await db
      .update(items)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async deleteItem(id: string, sellerId: string): Promise<boolean> {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.sellerId, sellerId)));
    return result.rowCount > 0;
  }

  async incrementItemViews(id: string): Promise<void> {
    await db
      .update(items)
      .set({ views: sql`${items.views} + 1` })
      .where(eq(items.id, id));
  }

  // Message operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationMessages(conversationId: string): Promise<MessageWithUsers[]> {
    const results = await db
      .select({
        id: messages.id,
        fromUserId: messages.fromUserId,
        toUserId: messages.toUserId,
        itemId: messages.itemId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        fromUser: users,
        toUser: { id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl },
        item: items,
      })
      .from(messages)
      .leftJoin(users, eq(messages.fromUserId, users.id))
      .leftJoin(items, eq(messages.itemId, items.id))
      .orderBy(messages.createdAt);

    return results.map(result => ({
      ...result,
      fromUser: result.fromUser!,
      toUser: result.toUser!,
      item: result.item || undefined,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update or create conversation
    const conversationExists = await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            and(
              eq(conversations.participant1Id, message.fromUserId),
              eq(conversations.participant2Id, message.toUserId)
            ),
            and(
              eq(conversations.participant1Id, message.toUserId),
              eq(conversations.participant2Id, message.fromUserId)
            )
          ),
          message.itemId ? eq(conversations.itemId, message.itemId) : sql`${conversations.itemId} IS NULL`
        )
      );

    if (conversationExists.length === 0) {
      await db.insert(conversations).values({
        participant1Id: message.fromUserId,
        participant2Id: message.toUserId,
        itemId: message.itemId,
        lastMessageAt: new Date(),
      });
    } else {
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationExists[0].id));
    }

    return newMessage;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.toUserId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  // Wishlist operations
  async addToWishlist(userId: string, itemId: string): Promise<void> {
    await db.insert(wishlist).values({ userId, itemId }).onConflictDoNothing();
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.itemId, itemId)));
  }

  async getUserWishlist(userId: string): Promise<ItemWithDetails[]> {
    const results = await db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        price: items.price,
        condition: items.condition,
        categoryId: items.categoryId,
        sellerId: items.sellerId,
        images: items.images,
        isActive: items.isActive,
        allowNegotiation: items.allowNegotiation,
        pickupOnly: items.pickupOnly,
        views: items.views,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        category: categories,
        seller: users,
      })
      .from(wishlist)
      .innerJoin(items, eq(wishlist.itemId, items.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(users, eq(items.sellerId, users.id))
      .where(eq(wishlist.userId, userId));

    return results.map(result => ({
      ...result,
      category: result.category || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
      seller: result.seller!,
    }));
  }

  async isItemInWishlist(userId: string, itemId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.itemId, itemId)));
    return !!result;
  }
}

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private items: Map<string, Item> = new Map();
  private categories: Map<string, Category> = new Map();
  private messages: Map<string, Message> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private wishlistEntries: Map<string, { userId: string; itemId: string; createdAt: Date }> = new Map();
  private usersByEmail: Map<string, User> = new Map();

  constructor() {
    // Initialize with sample categories
    this.initializeCategories();
  }

  private initializeCategories() {
    const defaultCategories = [
      { id: '1', name: 'Books & Textbooks', emoji: '📚', createdAt: new Date() },
      { id: '2', name: 'Electronics', emoji: '💻', createdAt: new Date() },
      { id: '3', name: 'Furniture', emoji: '🪑', createdAt: new Date() },
      { id: '4', name: 'Clothing', emoji: '👕', createdAt: new Date() },
      { id: '5', name: 'Sports & Recreation', emoji: '⚽', createdAt: new Date() },
      { id: '6', name: 'Other', emoji: '📦', createdAt: new Date() },
    ];
    
    for (const category of defaultCategories) {
      this.categories.set(category.id, category);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersByEmail.get(email);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      profileImageUrl: userData.profileImageUrl || null,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.usersByEmail.get(user.email);
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        ...user,
        updatedAt: new Date(),
      };
      this.users.set(updatedUser.id, updatedUser);
      this.usersByEmail.set(updatedUser.email, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(user);
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(name: string, emoji: string): Promise<Category> {
    const category: Category = {
      id: this.generateId(),
      name,
      emoji,
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
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
    let results = Array.from(this.items.values()).filter(item => item.isActive);

    if (filters) {
      if (filters.categoryId) {
        results = results.filter(item => item.categoryId === filters.categoryId);
      }
      if (filters.condition) {
        results = results.filter(item => item.condition === filters.condition);
      }
      if (filters.minPrice !== undefined) {
        results = results.filter(item => parseFloat(item.price) >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        results = results.filter(item => parseFloat(item.price) <= filters.maxPrice!);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(item => 
          item.title.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower))
        );
      }
      if (filters.sellerId) {
        results = results.filter(item => item.sellerId === filters.sellerId);
      }
    }

    return results.map(item => ({
      ...item,
      category: this.categories.get(item.categoryId || '') || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
      seller: this.users.get(item.sellerId)!,
    }));
  }

  async getItem(id: string): Promise<ItemWithDetails | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    return {
      ...item,
      category: this.categories.get(item.categoryId || '') || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
      seller: this.users.get(item.sellerId)!,
    };
  }

  async createItem(item: InsertItem): Promise<Item> {
    const newItem: Item = {
      ...item,
      id: this.generateId(),
      description: item.description || null,
      categoryId: item.categoryId || null,
      images: item.images || [],
      isActive: true,
      allowNegotiation: item.allowNegotiation || false,
      pickupOnly: item.pickupOnly || false,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.set(newItem.id, newItem);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string, sellerId: string): Promise<boolean> {
    const item = this.items.get(id);
    if (!item || item.sellerId !== sellerId) return false;
    
    return this.items.delete(id);
  }

  async incrementItemViews(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.views = (item.views || 0) + 1;
      this.items.set(id, item);
    }
  }

  // Message operations (simplified for in-memory storage)
  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.participant1Id === userId || conv.participant2Id === userId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getConversationMessages(conversationId: string): Promise<MessageWithUsers[]> {
    return Array.from(this.messages.values())
      .filter(msg => {
        const conv = this.conversations.get(conversationId);
        return conv && (
          (msg.fromUserId === conv.participant1Id && msg.toUserId === conv.participant2Id) ||
          (msg.fromUserId === conv.participant2Id && msg.toUserId === conv.participant1Id)
        );
      })
      .map(msg => ({
        ...msg,
        fromUser: this.users.get(msg.fromUserId)!,
        toUser: this.users.get(msg.toUserId)!,
        item: msg.itemId ? this.items.get(msg.itemId) : undefined,
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      itemId: message.itemId || null,
      isRead: false,
      createdAt: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);

    // Create or update conversation
    const existingConv = Array.from(this.conversations.values()).find(conv =>
      ((conv.participant1Id === message.fromUserId && conv.participant2Id === message.toUserId) ||
       (conv.participant1Id === message.toUserId && conv.participant2Id === message.fromUserId)) &&
      conv.itemId === (message.itemId || null)
    );

    if (existingConv) {
      existingConv.lastMessageAt = new Date();
      this.conversations.set(existingConv.id, existingConv);
    } else {
      const newConv: Conversation = {
        id: this.generateId(),
        participant1Id: message.fromUserId,
        participant2Id: message.toUserId,
        itemId: message.itemId || null,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };
      this.conversations.set(newConv.id, newConv);
    }

    return newMessage;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const conv = this.conversations.get(conversationId);
    if (!conv) return;

    Array.from(this.messages.values())
      .filter(msg => 
        msg.toUserId === userId &&
        !msg.isRead &&
        ((msg.fromUserId === conv.participant1Id && msg.toUserId === conv.participant2Id) ||
         (msg.fromUserId === conv.participant2Id && msg.toUserId === conv.participant1Id))
      )
      .forEach(msg => {
        msg.isRead = true;
        this.messages.set(msg.id, msg);
      });
  }

  // Wishlist operations
  async addToWishlist(userId: string, itemId: string): Promise<void> {
    const key = `${userId}-${itemId}`;
    this.wishlistEntries.set(key, { userId, itemId, createdAt: new Date() });
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    const key = `${userId}-${itemId}`;
    this.wishlistEntries.delete(key);
  }

  async getUserWishlist(userId: string): Promise<ItemWithDetails[]> {
    const userWishlistEntries = Array.from(this.wishlistEntries.values())
      .filter(entry => entry.userId === userId);

    return userWishlistEntries
      .map(entry => this.items.get(entry.itemId))
      .filter(item => item && item.isActive)
      .map(item => ({
        ...item!,
        category: this.categories.get(item!.categoryId || '') || { id: '', name: 'Uncategorized', emoji: '📦', createdAt: new Date() },
        seller: this.users.get(item!.sellerId)!,
      }));
  }

  async isItemInWishlist(userId: string, itemId: string): Promise<boolean> {
    const key = `${userId}-${itemId}`;
    return this.wishlistEntries.has(key);
  }
}

// Use MemStorage for development when database connection is not available
export const storage = new MemStorage();
