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
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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

export const storage = new DatabaseStorage();
