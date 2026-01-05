
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import type { Product } from '@/lib/types';
import { uploadImageToDrive } from '@/lib/google-drive';

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

const refinement = (data: Partial<z.infer<typeof baseProductSchema>>) => {
    if (data.category === 'ethnicWear' && data.subCategory) {
        return ["sarees", "kurtas & suits", "stitched suits", "unstitched material"].includes(data.subCategory);
    }
    if (data.category === 'bedsheet' && data.subCategory) {
        return ["pure cotton", "cotton blend"].includes(data.subCategory);
    }
    return true;
};

const productSchema = baseProductSchema.refine(refinement, {
    message: "Sub-category is not valid for the selected category",
    path: ["subCategory"],
});

const updateProductSchema = baseProductSchema.partial().refine(refinement, {
    message: "Sub-category is not valid for the selected category",
    path: ["subCategory"],
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

const getFileBuffer = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
};


export async function addProductAction(prevState: any, formData: FormData) {
  const rawData = {
    sku: formData.get('sku'),
    name: formData.get('name'),
    brand: formData.get('brand'),
    description: formData.get('description'),
    category: formData.get('category'),
    subCategory: formData.get('subCategory'),
    colors: (formData.get('colors') as string || '').split(',').map(s => s.trim()).filter(Boolean),
    sizes: (formData.get('sizes') as string || '').split(',').map(s => s.trim()).filter(Boolean),
    price: formData.get('price'),
    mrp: formData.get('mrp'),
    quantity: formData.get('quantity'),
    onWebsite: formData.get('onWebsite') === 'on',
    status: Number(formData.get('quantity')) > 0 ? "In Stock" : "Out of Stock",
    images: [],
  };
  
  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  const imageFiles = formData.getAll('images').filter(f => (f as File).size > 0) as File[];
  const imageUrls: string[] = [];

  try {
    const db = await getDb();

    // 1. Upload images to Google Drive
    for (const file of imageFiles) {
        const buffer = await getFileBuffer(file);
        const imageUrl = await uploadImageToDrive(buffer, file.name);
        if (imageUrl) {
            imageUrls.push(imageUrl);
        } else {
            throw new Error(`Failed to upload image: ${file.name}`);
        }
    }
    
    // 2. Insert product into database with image URLs
    const result = await db.collection('items').insertOne({ 
      ...validation.data, 
      images: imageUrls,
      desc: validation.data.description,
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

export async function uploadProductImageAction(productId: string, formData: FormData): Promise<{ success: boolean; message: string; images?: string[] }> {
    const file = formData.get('image') as File | null;
    if (!file || file.size === 0) {
        return { success: false, message: 'No image file provided.' };
    }

    try {
        const db = await getDb();
        const existingProduct = await db.collection('items').findOne({ _id: new ObjectId(productId) });

        if (!existingProduct) {
            return { success: false, message: 'Product not found.' };
        }

        const buffer = await getFileBuffer(file);
        const imageUrl = await uploadImageToDrive(buffer, file.name);

        if (!imageUrl) {
            throw new Error("Failed to get URL from image upload.");
        }

        const newImages = [...(existingProduct.images || []), imageUrl];

        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { images: newImages } }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'Image uploaded successfully.', images: newImages };
        } else {
            return { success: false, message: 'Failed to update product with new image.' };
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Image Upload Error: ${message}` };
    }
}


export async function updateProductAction(productId: string, prevState: any, formData: FormData) {
    
    const db = await getDb();
    const existingProduct = await db.collection('items').findOne({ _id: new ObjectId(productId) });

    if (!existingProduct) {
        return { success: false, message: 'Product not found.' };
    }
    
    const rawData = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory'),
      colors: (formData.get('colors') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      sizes: (formData.get('sizes') as string || '').split(',').map(s => s.trim()).filter(Boolean),
      price: formData.get('price'),
      mrp: formData.get('mrp'),
      quantity: formData.get('quantity'),
      onWebsite: formData.get('onWebsite') === 'on',
    };
    
    const validation = updateProductSchema.safeParse(rawData);

    if (!validation.success) {
        return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
    }
    
    const updateData: any = Object.fromEntries(
        Object.entries(validation.data).filter(([_, v]) => v !== undefined)
    );

    if (formData.get('clearImages') === 'true') {
        updateData.images = [];
    }
    
    if (updateData.description !== undefined) {
        updateData.desc = updateData.description;
    }

    if (updateData.quantity !== undefined) {
      updateData.status = Number(updateData.quantity) > 0 ? "In Stock" : "Out of Stock";
    }

    try {
        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: updateData }
        );
        
        const hasChanges = Object.keys(updateData).some(key => {
            if (key === 'desc' || key === 'status') return false; // these are derived
            if (Array.isArray(updateData[key])) {
                return JSON.stringify(updateData[key]) !== JSON.stringify(existingProduct[key]);
            }
            return updateData[key] !== existingProduct[key];
        });


        if (result.modifiedCount > 0 || hasChanges) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'Product updated successfully.' };
        } else {
            return { success: true, message: 'No changes were made to the product.' };
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

export async function removeAllProductImagesAction(productId: string) {
    try {
        const db = await getDb();
        const result = await db.collection('items').updateOne(
            { _id: new ObjectId(productId) },
            { $set: { images: [] } }
        );

        if (result.modifiedCount > 0) {
            revalidatePath('/dashboard/inventory');
            return { success: true, message: 'All images removed successfully.', images: [] };
        } else {
            return { success: false, message: 'Failed to remove images or no images to remove.' };
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Database Error: ${message}` };
    }
}
    
