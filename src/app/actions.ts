
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(credentials: z.infer<typeof loginSchema>) {
  const validation = loginSchema.safeParse(credentials);
  if (!validation.success) {
    return { success: false, message: 'Invalid email or password format.' };
  }

  const { email, password } = validation.data;

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
    
    // Using 'users' collection as per user request to check from 'AdminUsers' which implies a general users collection.
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    if (!user.password) {
        return { success: false, message: 'Invalid credentials. Please contact support.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid email or password.' };
    }

    // Here you would typically create a session, set a cookie, etc.
    // For now, we just return success.
    return { success: true, message: 'Login successful!' };

  } catch (error) {
    console.error('[loginAction] Error:', error);
    return { success: false, message: 'An internal server error occurred.' };
  }
}
