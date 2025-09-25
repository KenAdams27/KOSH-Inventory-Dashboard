
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signupAction(credentials: z.infer<typeof signupSchema>) {
  const validation = signupSchema.safeParse(credentials);
  if (!validation.success) {
    return { success: false, message: 'Invalid data provided.' };
  }

  const { name, email, password } = validation.data;

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
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return { success: true, message: 'Account created successfully!' };

  } catch (error) {
    console.error('[signupAction] Error:', error);
    return { success: false, message: 'An internal server error occurred.' };
  }
}
