
'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

const emailSchema = z.string().email();

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

export async function forgotPasswordAction(email: string) {
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
        return { success: false, message: 'Invalid email address.' };
    }

    try {
        const db = await getDb();
        const user = await db.collection('AdminUsers').findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (!user) {
            // To prevent email enumeration, we send a success-like message even if the user doesn't exist.
            // The email sending would just be silently skipped.
            console.log(`[Forgot Password] Request for non-existent user: ${email}`);
            return { success: true, message: "If an account with this email exists, a password reset code has been sent." };
        }

        // Generate a 4-digit OTP
        const resetToken = randomInt(1000, 10000).toString(); 
        const hashedToken = await bcrypt.hash(resetToken, 10);
        
        // Set token expiry for 10 minutes from now
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

        await db.collection('AdminUsers').updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: resetTokenExpires,
                },
            }
        );

        // --- Simulate Sending Email ---
        // In a real application, you would use an email service like Nodemailer, SendGrid, or Resend here.
        console.log('--- PASSWORD RESET ---');
        console.log(`Email intended for: ${email}`);
        console.log(`Your 4-digit password reset code is: ${resetToken}`);
        console.log('This code will expire in 10 minutes.');
        console.log('--------------------');
        // --------------------------

        return { success: true, message: "A 4-digit reset code has been sent to your email (check the console)." };

    } catch (error) {
        console.error('[forgotPasswordAction] Error:', error);
        return { success: false, message: 'An internal server error occurred.' };
    }
}
