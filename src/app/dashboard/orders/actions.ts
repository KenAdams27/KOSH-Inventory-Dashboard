
'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['placed', 'dispatched', 'delivered']),
  trackingId: z.string().optional(),
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

export async function updateOrderStatusAction(orderId: string, status: 'placed' | 'dispatched' | 'delivered', trackingId?: string) {
  const validation = updateOrderStatusSchema.safeParse({ orderId, status, trackingId });
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }
  
  try {
    const db = await getDb();
    
    const updatePayload: any = { 
      status: status,
      isDelivered: status === 'delivered'
    };

    if (trackingId !== undefined) {
      updatePayload.tracking_id = trackingId;
    }
    
    if (status === 'delivered') {
      updatePayload.deliveredAt = new Date().toISOString();
    } else if (status === 'dispatched' && trackingId) {
      updatePayload.tracking_id = trackingId;
    } 
    
    if (status !== 'delivered') {
       // If moving away from delivered, unset deliveredAt
       // Using $unset to remove the field completely
       const result = await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: updatePayload,
          $unset: { deliveredAt: "" } 
        }
      );

       if (result.modifiedCount > 0) {
        revalidatePath('/dashboard/orders');
        return { success: true, message: 'Order status updated successfully.' };
      } else {
        return { success: false, message: 'Failed to update order status or no changes were made.' };
      }

    } else {
       const result = await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: updatePayload
        }
      );
      if (result.modifiedCount > 0) {
        revalidatePath('/dashboard/orders');
        return { success: true, message: 'Order status updated successfully.' };
      } else {
        return { success: false, message: 'Failed to update order status or no changes were made.' };
      }
    }


  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Database Error: ${message}` };
  }
}

export async function deleteOrderAction(orderId: string) {
    try {
        const db = await getDb();
        const result = await db.collection('orders').deleteOne({ _id: new ObjectId(orderId) });

        if (result.deletedCount > 0) {
            revalidatePath('/dashboard/orders');
            return { success: true, message: 'Order deleted successfully.' };
        } else {
            return { success: false, message: 'Failed to delete order.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}
