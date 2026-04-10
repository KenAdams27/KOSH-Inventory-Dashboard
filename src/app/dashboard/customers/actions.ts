'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { sendWelcomeEmail } from '@/lib/brevo';
import type { Customer } from '@/lib/types';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  isDefault: z.boolean().default(false),
});

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').or(z.literal('')),
  address: z.array(addressSchema).optional(),
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

export async function addCustomerAction(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
  };

  const validation = customerSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  try {
    const db = await getDb();
    
    // Check if customer already exists
    const existing = await db.collection('users').findOne({ email: validation.data.email });
    if (existing) {
      return { success: false, message: 'A customer with this email already exists.' };
    }

    const newCustomer = {
      ...validation.data,
      wishlist: [],
      cart: [],
      orders: [],
      address: [],
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newCustomer);

    if (result.acknowledged) {
      // Send Welcome Email automatically in the background
      sendWelcomeEmail({
        customerEmail: validation.data.email,
        customerName: validation.data.name,
      }).catch(err => console.error("Automatic Welcome Email failed:", err));

      revalidatePath('/dashboard/customers');
      return { success: true, message: 'Customer added successfully. Welcome email sent.' };
    }

    return { success: false, message: 'Failed to add customer.' };
  } catch (error) {
    console.error('[addCustomerAction] Error:', error);
    return { success: false, message: 'An internal server error occurred.' };
  }
}
