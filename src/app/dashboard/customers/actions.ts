
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Customer } from '@/lib/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export async function addCustomerAction(formData: Omit<Customer, 'id'>) {
  try {
    const validation = customerSchema.safeParse(formData);
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
    
    const newCustomer = {
        ...validation.data,
    }

    const result = await db.collection('users').insertOne(newCustomer);

    if (result.acknowledged) {
        revalidatePath('/dashboard/customers');
        return { success: true, message: 'Customer added successfully.' };
    } else {
        return { success: false, message: 'Failed to add customer.' };
    }

  } catch (error) {
    console.error('[addCustomerAction] Error adding customer:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Database Error: ${message}` };
  }
}

export async function updateCustomerAction(customerId: string, formData: Omit<Customer, 'id'>) {
    try {
        const validation = customerSchema.safeParse(formData);
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
