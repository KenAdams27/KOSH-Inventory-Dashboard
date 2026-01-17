
'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { sendOrderStatusUpdateEmail, sendOrderConfirmationEmail } from '@/lib/brevo';
import type { Customer, Order, OrderStatus } from '@/lib/types';


const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['placed', 'dispatched', 'delivered', 'Refund Initiated', 'Refund Complete']),
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


async function getCustomerForOrder(userId: string): Promise<Customer | null> {
  try {
    const db = await getDb();
    const customer = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!customer) return null;
    
    // Manually serialize the customer object
    const { _id, password, ...rest } = customer;
    const serializableCustomer: Customer = {
      id: _id.toString(),
      name: rest.name,
      email: rest.email,
      phone: rest.phone,
    };
    
    return serializableCustomer;

  } catch (error) {
    console.error('[getCustomerForOrder] Error fetching customer:', error);
    return null;
  }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, trackingId?: string, sendEmail?: boolean) {
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
    
    let result;
    if (status !== 'delivered') {
       // If moving away from delivered, unset deliveredAt
       // Using $unset to remove the field completely
       result = await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: updatePayload,
          $unset: { deliveredAt: "" } 
        }
      );
    } else {
       result = await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: updatePayload
        }
      );
    }
    
    if (result.modifiedCount > 0) {
        revalidatePath('/dashboard/orders');

        if (sendEmail) {
            const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
            if (order && order.user) {
                const customer = await getCustomerForOrder(order.user.toString());
                if (customer && customer.email) {
                    const emailResult = await sendOrderStatusUpdateEmail({
                        customerEmail: customer.email,
                        customerName: customer.name,
                        orderId: orderId,
                        newStatus: status,
                        trackingId: trackingId,
                    });
                    
                    if (emailResult.success) {
                        await db.collection('orders').updateOne(
                            { _id: new ObjectId(orderId) },
                            { $addToSet: { notifiedStatuses: status } }
                        );
                    }
                } else {
                    console.warn(`[updateOrderStatusAction] Could not find customer or customer email for user ID: ${order.user.toString()}`);
                }
            } else {
                console.warn(`[updateOrderStatusAction] Could not find order to send email for order ID: ${orderId}`);
            }
        }
        
        return { success: true, message: 'Order status updated successfully.' };
    } else {
        return { success: false, message: 'Failed to update order status or no changes were made.' };
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

export async function sendBulkConfirmationEmailsAction() {
  try {
    const db = await getDb();
    const ordersToSend = await db.collection('orders').find({
      status: 'placed',
      $or: [
        { notifiedStatuses: { $exists: false } },
        { notifiedStatuses: { $ne: 'placed' } }
      ]
    }).toArray();

    if (ordersToSend.length === 0) {
      return { success: true, message: 'No pending confirmation emails to send.' };
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const dbOrder of ordersToSend) {
      const customer = await getCustomerForOrder(dbOrder.user.toString());
      
      if (customer && customer.email) {
        const fullOrder: Order = {
            _id: dbOrder._id.toHexString(),
            id: dbOrder._id.toString(),
            user: dbOrder.user.toString(),
            orderItems: dbOrder.orderItems.map((item: any) => {
                const { _id, item: itemId, ...rest } = item;
                return { ...rest, itemId: itemId?.toString() };
            }),
            shippingAddress: dbOrder.shippingAddress,
            paymentMethod: dbOrder.paymentMethod,
            totalPrice: dbOrder.totalPrice,
            isPaid: dbOrder.isPaid,
            paidAt: dbOrder.paidAt,
            status: dbOrder.status,
            deliveredAt: dbOrder.deliveredAt,
            createdAt: dbOrder.createdAt.toISOString(),
            tracking_id: dbOrder.tracking_id,
            notifiedStatuses: dbOrder.notifiedStatuses || [],
        };

        const emailResult = await sendOrderConfirmationEmail({
          customerEmail: customer.email,
          customerName: customer.name,
          order: fullOrder,
        });

        if (emailResult.success) {
          await db.collection('orders').updateOne(
            { _id: dbOrder._id },
            { $addToSet: { notifiedStatuses: 'placed' } }
          );
          sentCount++;
        } else {
          console.error(`Failed to send email for order ${dbOrder._id.toString()}`);
          errorCount++;
        }
      } else {
        console.error(`Could not find customer or email for order ${dbOrder._id.toString()}`);
        errorCount++;
      }
    }
    
    if (sentCount > 0) {
        revalidatePath('/dashboard/orders');
    }
    
    return { success: true, message: `${sentCount} confirmation emails sent. ${errorCount} failed.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Database Error: ${message}` };
  }
}
