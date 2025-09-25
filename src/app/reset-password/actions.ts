
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
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

export async function resetPasswordAction(payload: z.infer<typeof resetPasswordSchema>) {
    const validation = resetPasswordSchema.safeParse(payload);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.' };
    }
    
    const { email, code, newPassword } = validation.data;

    try {
        const db = await getDb();
        const user = await db.collection('AdminUsers').findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') },
            resetPasswordToken: { $exists: true },
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user || !user.resetPasswordToken) {
            return { success: false, message: 'Invalid or expired reset code. Please try again.' };
        }

        const isTokenValid = await bcrypt.compare(code, user.resetPasswordToken);

        if (!isTokenValid) {
            return { success: false, message: 'Invalid or expired reset code. Please try again.' };
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.collection('AdminUsers').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: {
                    resetPasswordToken: "",
                    resetPasswordExpires: "",
                }
            }
        );

        return { success: true, message: 'Your password has been reset successfully. Please log in.' };

    } catch (error) {
        console.error('[resetPasswordAction] Error:', error);
        return { success: false, message: 'An internal server error occurred.' };
    }
}
