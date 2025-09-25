
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
    
    // Use a case-insensitive regex for the email lookup
    const user = await db.collection('users').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!user || !user.password) {
      if (user) {
        // For debugging: log user if found but password check fails, excluding password.
        const { password, ...userWithoutPassword } = user;
        console.error('[loginAction] User found, but password validation failed. User data:', userWithoutPassword);
      } else {
        console.error('[loginAction] No user found for email:', email);
      }
      return { success: false, message: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
       // For debugging: log user if found but password check fails, excluding password.
       const { password, ...userWithoutPassword } = user;
       console.error('[loginAction] User found, but password validation failed. User data:', userWithoutPassword);
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
