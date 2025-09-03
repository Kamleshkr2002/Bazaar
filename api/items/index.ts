import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoStorage } from '../../server/mongodb-storage';
import { insertItemSchema } from '../../shared/mongodb-schemas';
import { z } from 'zod';

const storage = new MongoStorage();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { categoryId, condition, minPrice, maxPrice, search, sellerId } = req.query;
      
      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId as string;
      if (condition) filters.condition = condition as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (search) filters.search = search as string;
      if (sellerId) filters.sellerId = sellerId as string;

      const items = await storage.getItems(filters);
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Failed to fetch items' });
    }
  } else if (req.method === 'POST') {
    try {
      // In a real app, you'd get userId from authentication middleware
      // For now, we'll require it in the request body
      const itemData = insertItemSchema.parse(req.body);
      
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid item data', errors: error.errors });
      }
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Failed to create item' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}