
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const reviewSchema = z.object({
    name: z.string(),
    rating: z.number(),
    title: z.string(),
    review: z.string(),
    image: z.string().optional(),
    createdAt: z.string().datetime(),
});

const baseProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["ethnicWear", "bedsheet"]),
  subCategory: z.string().optional(),
  colors: z.array(z.string()).min(1, "Please enter at least one color"),
  sizes: z.array(z.string()).min(1, "Please enter at least one size"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  mrp: z.coerce.number().min(0, "MRP must be a positive number").optional(),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
  rating: z.coerce.number().min(0).max(5).default(0),
  onWebsite: z.boolean().default(true),
  images: z.array(z.string()).optional(),
  reviews: z.array(reviewSchema).optional(),
});

const productSchema = baseProductSchema.refine(data => {
    if (data.category === 'ethnicWear' && data.subCategory) {
        return ["sarees", "kurtas & suits", "stitched suits", "unstitched material"].includes(data.subCategory);
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

// Helper to get file buffer
async function getFileBuffer(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function addProductAction(prevState: any, formData: FormData) {
  
  const files = [
    formData.get('image1') as File,
    formData.get('image2') as File,
    formData.get('image3') as File,
    formData.get('image4') as File,
  ].filter(file => file && file.size > 0);

  const rawData = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory') || undefined,
      colors: (formData.get('colors') as string || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      sizes: (formData.get('sizes') as string || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      price: formData.get('price'),
      mrp: formData.get('mrp'),
      quantity: formData.get('quantity'),
      onWebsite: formData.get('onWebsite') === 'true',
      status: Number(formData.get('quantity')) > 0 ? "In Stock" : "Out of Stock",
  };

  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    console.error("Validation Errors:", validation.error.flatten().fieldErrors);
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  try {
    const db = await getDb();
    const tempId = new ObjectId().toHexString();

    const imageUrls = await Promise.all(
        files.map(async (file, index) => {
            const buffer = await getFileBuffer(file);
            return uploadImageToCloudinary(buffer, tempId, index + 1);
        })
    );

    const result = await db.collection('items').insertOne({
        _id: new ObjectId(tempId),
        ...validation.data, 
        desc: validation.data.description,
        images: imageUrls,
        reviews: [], // Initialize with an empty array
    });

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

export async function updateProductAction(productId: string, prevState: any, formData: FormData) {
    const files = [
      formData.get('image1') as File,
      formData.get('image2') as File,
      formData.get('image3') as File,
      formData.get('image4') as File,
    ].filter(file => file && file.size > 0);

    const rawData: any = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory') || undefined,
      price: formData.get('price'),
      mrp: formData.get('mrp'),
      quantity: formData.get('quantity'),
      onWebsite: formData.get('onWebsite') === 'true',
    };

    const colorsStr = formData.get('colors') as string;
    if (colorsStr) {
      rawData.colors = colorsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    const sizesStr = formData.get('sizes') as string;
    if (sizesStr) {
      rawData.sizes = sizesStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (rawData.quantity !== undefined) {
      rawData.status = Number(rawData.quantity) > 0 ? "In Stock" : "Out of Stock";
    }

    const validation = updateProductSchema.safeParse(rawData);
    if (!validation.success) {
        console.error("Validation Errors:", validation.error.flatten().fieldErrors);
        return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
    }
    
    const updateData: any = { ...validation.data };
    if (updateData.description) {
        updateData.desc = updateData.description;
    }

    try {
        const db = await getDb();

        if (files.length > 0) {
           const imageUrls = await Promise.all(
                files.map(async (file, index) => {
                    const buffer = await getFileBuffer(file);
                    return uploadImageToCloudinary(buffer, productId, index + 1);
                })
            );
          updateData.images = imageUrls;
        }

        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: updateData }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'Product updated successfully.' };
        } else {
            // Check if there was no change but it was a "success" (e.g., no fields changed)
            const existingProduct = await db.collection('items').findOne({ _id: new ObjectId(productId) });
            // A simple check to see if an image upload was attempted could be done here if needed
            if (existingProduct && files.length > 0) {
                 revalidatePath('/dashboard/inventory');
                 return { success: true, message: 'Product updated successfully (images replaced).' };
            }
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

export async function updateProductWebsiteStatus(productId: string, onWebsite: boolean) {
    try {
        const db = await getDb();
        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { onWebsite } }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: `Product is now ${onWebsite ? 'on the website' : 'off the website'}.` };
        } else {
            return { success: true, message: 'No change in product status.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}
