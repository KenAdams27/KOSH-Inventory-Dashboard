
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
    
    const user = await db.collection('AdminUsers').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!user) {
      console.error('[loginAction] No user found for email:', email);
      return { success: false, message: 'Invalid email or password.' };
    }

    if (!user.password) {
        const { password: userPassword, ...userWithoutPassword } = user;
        console.error('[loginAction] User found, but has no password field. User data:', userWithoutPassword);
        return { success: false, message: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
       const { password: userPassword, ...userWithoutPassword } = user;
       console.error('[loginAction] User found, but password validation failed. User data:', userWithoutPassword);
      return { success: false, message: 'Invalid email or password.' };
    }
    
    // Set session cookie
    cookies().set('session', 'loggedIn', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

  } catch (error) {
    console.error('[loginAction] Error:', error);
    return { success: false, message: 'An internal server error occurred.' };
  }

  // Redirect to dashboard on successful login
  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete('session');
  redirect('/');
}
