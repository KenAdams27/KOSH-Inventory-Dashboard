import { NextResponse } from 'next/server';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { sendOrderConfirmationEmail } from '@/lib/brevo';
import { ObjectId } from 'mongodb';
import type { Customer, Order } from '@/lib/types';

// Define schema for incoming order data for validation
const orderItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  quantity: z.number().min(1),
  price: z.number(),
  image: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

const shippingAddressSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  pincode: z.string(),
  country: z.string(),
});

const createOrderSchema = z.object({
  user: z.string(), // User ID
  orderItems: z.array(orderItemSchema),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["Cash on Delivery", "Card", "UPI"]),
  totalPrice: z.number(),
  isPaid: z.boolean(),
  paidAt: z.string().optional(),
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

async function getCustomer(userId: string): Promise<Customer | null> {
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    const { _id, ...rest } = user;
    return { id: _id.toString(), name: rest.name, email: rest.email, phone: rest.phone };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid order data.', errors: validation.error.flatten() }, { status: 400 });
    }

    const db = await getDb();
    const orderData = validation.data;

    const orderToInsert = {
      ...orderData,
      user: new ObjectId(orderData.user),
      orderItems: orderData.orderItems.map(({ itemId, ...rest }) => ({
        ...rest,
        item: new ObjectId(itemId),
      })),
      status: 'placed' as const,
      createdAt: new Date(),
    };
    
    const result = await db.collection('orders').insertOne(orderToInsert);

    if (!result.insertedId) {
      throw new Error('Failed to insert order into database.');
    }

    // Now, send the email
    const customer = await getCustomer(orderData.user);
    if (customer && customer.email) {
        const fullOrder : Order = {
            ...orderData,
            _id: result.insertedId.toHexString(),
            id: result.insertedId.toString(),
            createdAt: orderToInsert.createdAt.toISOString(),
            status: 'placed',
            orderItems: orderData.orderItems.map(i => ({...i, itemId: i.itemId.toString()})),
        };

        await sendOrderConfirmationEmail({
            customerEmail: customer.email,
            customerName: customer.name,
            order: fullOrder,
        });
    }

    return NextResponse.json({ success: true, message: 'Order created successfully.', orderId: result.insertedId });

  } catch (error) {
    console.error('[Create Order API] Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: `Server Error: ${message}` }, { status: 500 });
  }
}
