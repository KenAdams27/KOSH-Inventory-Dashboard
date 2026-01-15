
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

// This is the canonical schema for a customer/user.
const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').or(z.literal('')),
  wishlist: z.array(cartItemSchema).optional(),
  cart: z.array(cartItemSchema).optional(),
  orders: z.array(z.string()).optional(),
  address: z.array(addressSchema).optional(),
});
