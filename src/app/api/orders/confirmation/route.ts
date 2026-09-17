import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendOrderConfirmationEmail } from '@/lib/brevo';
import type { Order } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (!clientPromise) {
      return NextResponse.json(
        { success: false, message: 'Database client not available.' },
        { status: 500 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.DB_NAME;
    if (!dbName) {
        return NextResponse.json({ success: false, message: 'DB_NAME environment variable is not set.' }, { status: 500 });
    }
    const db = client.db(dbName);

    // 1. Find the order in MongoDB
    const dbOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!dbOrder) {
      return NextResponse.json(
        { success: false, message: `Order with ID ${orderId} not found.` },
        { status: 404 }
      );
    }

    // 2. Find the customer (user) associated with the order to get their email
    const dbUser = await db.collection('users').findOne({ _id: new ObjectId(dbOrder.user) });
    if (!dbUser || !dbUser.email) {
      return NextResponse.json(
        { success: false, message: 'Customer details or email not found for this order.' },
        { status: 404 }
      );
    }

    // 3. Construct a serializable Order object for the email template
    const order: Order = {
        _id: dbOrder._id.toHexString(),
        id: dbOrder._id.toString(),
        user: dbOrder.user.toString(),
        orderItems: dbOrder.orderItems.map((item: any) => {
            const { _id: itemIdRaw, item: prodId, ...rest } = item;
            return {
                ...rest,
                itemId: prodId?.toString() || item.itemId?.toString() || itemIdRaw?.toString() || ''
            };
        }),
        shippingAddress: dbOrder.shippingAddress,
        paymentMethod: dbOrder.paymentMethod,
        totalPrice: dbOrder.totalPrice,
        isPaid: dbOrder.isPaid,
        paidAt: dbOrder.paidAt,
        status: dbOrder.status || 'placed',
        deliveredAt: dbOrder.deliveredAt,
        createdAt: dbOrder.createdAt instanceof Date ? dbOrder.createdAt.toISOString() : dbOrder.createdAt,
        tracking_id: dbOrder.tracking_id,
        dispatched_by: dbOrder.dispatched_by,
        tracking_link: dbOrder.tracking_link,
        notifiedStatuses: dbOrder.notifiedStatuses || [],
    };

    // 4. Send the email via Brevo
    const result = await sendOrderConfirmationEmail({
      customerEmail: dbUser.email,
      customerName: dbUser.name,
      order,
    });

    if (result.success) {
      // 5. Update notified statuses so the dashboard knows the email was sent
      await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        { $addToSet: { notifiedStatuses: 'placed' } }
      );
      
      return NextResponse.json({ success: true, message: 'Order confirmation email sent successfully.' });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API Order Confirmation] Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, message: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
