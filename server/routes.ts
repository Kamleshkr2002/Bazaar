import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertItemSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize categories
  await initializeCategories();

  // Note: Auth routes (/api/login, /api/register, /api/logout, /api/auth/user) are now handled in auth.ts

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Items
  app.get('/api/items', async (req, res) => {
    try {
      const { categoryId, condition, minPrice, maxPrice, search } = req.query;
      const filters = {
        categoryId: categoryId as string,
        condition: condition as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        search: search as string,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const items = await storage.getItems(filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get('/api/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementItemViews(id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post('/api/items', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const itemData = insertItemSchema.parse({
        ...req.body,
        sellerId: userId,
      });
      
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put('/api/items/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Verify item belongs to user
      const existingItem = await storage.getItem(id);
      if (!existingItem || existingItem.sellerId !== userId) {
        return res.status(404).json({ message: "Item not found" });
      }

      const updates = insertItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/items/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await storage.deleteItem(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // User's items
  app.get('/api/my-items', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getItems({ sellerId: userId });
      res.json(items);
    } catch (error) {
      console.error("Error fetching user items:", error);
      res.status(500).json({ message: "Failed to fetch user items" });
    }
  });

  // Wishlist
  app.get('/api/wishlist', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist/:itemId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      
      await storage.addToWishlist(userId, itemId);
      res.json({ message: "Added to wishlist" });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:itemId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      
      await storage.removeFromWishlist(userId, itemId);
      res.json({ message: "Removed from wishlist" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  app.get('/api/wishlist/check/:itemId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      
      const isInWishlist = await storage.isItemInWishlist(userId, itemId);
      res.json({ isInWishlist });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ message: "Failed to check wishlist" });
    }
  });

  // Messages and Conversations
  app.get('/api/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const messages = await storage.getConversationMessages(id);
      await storage.markMessagesAsRead(id, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: userId,
      });
      
      const message = await storage.createMessage(messageData);
      
      // Emit message via socket
      req.io?.to(`user_${messageData.toUserId}`).emit('newMessage', message);
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.IO for real-time messaging
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room`);
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        const message = await storage.createMessage(messageData);
        io.to(`user_${messageData.toUserId}`).emit('newMessage', message);
      } catch (error) {
        console.error('Error sending message via socket:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Make io available to routes
  app.set('io', io);

  return httpServer;
}

async function initializeCategories() {
  try {
    const categories = await storage.getCategories();
    if (categories.length === 0) {
      // Initialize with default categories
      const defaultCategories = [
        { name: 'Books', emoji: '📚' },
        { name: 'Electronics', emoji: '💻' },
        { name: 'Furniture', emoji: '🪑' },
        { name: 'Clothing', emoji: '👕' },
        { name: 'Sports', emoji: '⚽' },
        { name: 'Other', emoji: '📦' },
      ];

      // Note: This would need to be implemented in storage if we want to create categories
      console.log('Categories initialized');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}
