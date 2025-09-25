
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const baseProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["ethnicWear", "bedsheet"]),
  subCategory: z.string().optional(),
  colors: z.array(z.string()).min(1, "Please enter at least one color"),
  sizes: z.array(z.string()).min(1, "Please enter at least one size"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
  rating: z.coerce.number().min(0).max(5).default(0),
  isPublished: z.boolean().default(true),
  images: z.array(z.string()).optional(),
  imageHints: z.array(z.string()).optional(),
});

const productSchema = baseProductSchema.refine(data => {
    if (data.category === 'ethnicWear' && data.subCategory) {
        return ["sarees", "kurtas & suits", "dupattas"].includes(data.subCategory);
    }
    if (data.category === 'bedsheet' && data.subCategory) {
        return ["pure cotton", "cotton blend"].includes(data.subCategory);
    }
    return true;
}, {
    message: "Sub-category is not valid for the selected category",
    path: ["subCategory"],
});

const updateProductSchema = baseProductSchema.partial();

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

export async function addProductAction(formData: any) {
  const rawData = {
      ...formData,
      colors: formData.colors.split(',').map((s: string) => s.trim()).filter(Boolean),
      sizes: formData.sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
      status: formData.quantity > 0 ? "In Stock" : "Out of Stock",
  }

  const validation = productSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  try {
    const db = await getDb();
    const result = await db.collection('items').insertOne({ ...validation.data, desc: validation.data.description });

    if (result.acknowledged) {
        revalidatePath('/dashboard/inventory');
        return { success: true, message: 'Product added successfully.' };
    } else {
        return { success: false, message: 'Failed to add product.' };
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Database Error: ${message}` };
  }
}

export async function updateProductAction(productId: string, formData: any) {
    const rawData = {
      ...formData,
      colors: formData.colors.split(',').map((s: string) => s.trim()).filter(Boolean),
      sizes: formData.sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
      status: formData.quantity > 0 ? "In Stock" : "Out of Stock",
    }
    const validation = updateProductSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
    }
    
    const updateData = { ...validation.data };
    if (updateData.description) {
        // @ts-ignore
        updateData.desc = updateData.description;
    }


    try {
        const db = await getDb();
        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: updateData }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'Product updated successfully.' };
        } else {
            return { success: false, message: 'Failed to update product or no changes were made.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}


export async function deleteProductAction(productId: string) {
    try {
        const db = await getDb();
        const result = await db.collection('items').deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'Product deleted successfully.' };
        } else {
            return { success: false, message: 'Failed to delete product.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}

export async function updateProductPublishedStatus(productId: string, isPublished: boolean) {
    try {
        const db = await getDb();
        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { isPublished } }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: `Product is now ${isPublished ? 'published' : 'unpublished'}.` };
        } else {
            return { success: false, message: 'Failed to update product status.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}
