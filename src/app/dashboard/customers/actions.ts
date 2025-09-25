
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
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

const cartItemSchema = z.object({
  itemId: z.string(), // Assuming ObjectId is string
  size: z.string(),
  quantity: z.number().min(1).default(1),
  color: z.string(),
});

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .refine(value => /^(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(value), {
      message: 'Password must include at least one capital letter and one special character (!@#$%^&*)'
    }),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  wishlist: z.array(cartItemSchema).optional(),
  cart: z.array(cartItemSchema).optional(),
  orders: z.array(z.string()).optional(),
  address: z.array(addressSchema).optional(),
});

// For update, we don't require the password
const updateCustomerSchema = customerSchema.extend({
  password: z.string().optional(),
});

export async function updateCustomerAction(customerId: string, formData: Partial<Omit<Customer, 'id'>>) {
    try {
        const validation = updateCustomerSchema.safeParse(formData);
        if (!validation.success) {
            return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
        }

        if (!clientPromise) {
            throw new Error('MongoDB client is not available.');
        }
        const client = await clientPromise;
        const dbName = process.env.DB_NAME;
        if (!dbName) {
            throw new Error('DB_NAME environment variable is not set.');
        }
        const db = client.db(dbName);

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(customerId) },
            { $set: validation.data }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/customers');
            return { success: true, message: 'Customer updated successfully.' };
        } else {
            return { success: false, message: 'Failed to update customer or no changes were made.' };
        }
    } catch (error) {
        console.error('[updateCustomerAction] Error updating customer:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}

export async function deleteCustomerAction(customerId: string) {
    try {
        if (!clientPromise) {
            throw new Error('MongoDB client is not available.');
        }
        const client = await clientPromise;
        const dbName = process.env.DB_NAME;
        if (!dbName) {
            throw new Error('DB_NAME environment variable is not set.');
        }
        const db = client.db(dbName);

        const result = await db.collection('users').deleteOne({ _id: new ObjectId(customerId) });

        if (result.deletedCount > 0) {
            revalidatePath('/dashboard/customers');
            return { success: true, message: 'Customer deleted successfully.' };
        } else {
            return { success: false, message: 'Failed to delete customer.' };
        }
    } catch (error) {
        console.error('[deleteCustomerAction] Error deleting customer:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}
