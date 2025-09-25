
'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  isDelivered: z.boolean(),
});

async function getDb() {
    if (!clientPromise) {
        throw new Error('MongoDB client is not available.');
    }
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;
    if (!dbName) {
        throw new Error('DB_NAME environment variable is not set.');
    }
    return client.db(dbName);
}

export async function updateOrderStatusAction(orderId: string, isDelivered: boolean) {
  const validation = updateOrderStatusSchema.safeParse({ orderId, isDelivered });
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }
  
  try {
    const db = await getDb();
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          isDelivered: isDelivered,
          deliveredAt: isDelivered ? new Date().toISOString() : undefined
        } 
      }
    );

    if (result.modifiedCount > 0) {
      revalidatePath('/dashboard/orders');
      return { success: true, message: 'Order status updated successfully.' };
    } else {
      return { success: false, message: 'Failed to update order status or no changes were made.' };
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Database Error: ${message}` };
  }
}
