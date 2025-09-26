
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  secretCode: z.string().length(4, 'Secret code must be 4 digits'),
});

const SECRET_CODE = process.env.SECRET_KEY;

export async function signupAction(credentials: z.infer<typeof signupSchema>) {
  const validation = signupSchema.safeParse(credentials);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(', ');
    return { success: false, message: `Invalid data provided: ${errorMessages}` };
  }

  const { name, email, password, secretCode } = validation.data;

  if (!SECRET_CODE) {
    console.error('SECRET_KEY environment variable is not set.');
    return { success: false, message: 'Server configuration error.' };
  }

  if (secretCode !== SECRET_CODE) {
    return { success: false, message: 'Invalid secret code.' };
  }

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
    
    // Check if user already exists in AdminUsers collection
    const existingUser = await db.collection('AdminUsers').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into AdminUsers collection
    await db.collection('AdminUsers').insertOne({
      name,
      email,
      username: email, // Use email as username to satisfy unique index
      password: hashedPassword,
      createdAt: new Date(),
    });

    return { success: true, message: 'Account created successfully!' };

  } catch (error) {
    console.error('[signupAction] Error:', error);
    if (error instanceof Error) {
        // Handle potential duplicate key errors on username more gracefully
        if (error.message.includes('E11000')) {
             return { success: false, message: 'An account with this email or username already exists.' };
        }
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred during sign-up.' };
  }
}
