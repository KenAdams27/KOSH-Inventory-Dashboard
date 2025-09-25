
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Define the ImageKit upload URL as a constant
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

// Helper function to upload files to ImageKit
async function uploadToImageKit(files: File[], name: string, brand: string) {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error("ImageKit private key is not configured.");
    }
    
    const uploadedUrls: string[] = [];
    const imageHints: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || file.size === 0) continue;

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("fileName", `${name} by ${brand} - ${i + 1}.jpg`);
        uploadFormData.append("folder", "/KOSH Images/");

        const response = await fetch(IMAGEKIT_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`
            },
            body: uploadFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ImageKit Upload Error:", errorText);
            throw new Error(`ImageKit upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        uploadedUrls.push(result.url);
        imageHints.push(`${name} ${brand}`);
    }

    return { uploadedUrls, imageHints };
}


const baseProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().optional(),
  category: z.enum(["ethnicWear", "bedsheet"]),
  subCategory: z.string().optional(),
  colors: z.array(z.string()).min(1, "Please enter at least one color"),
  sizes: z.array(z.array(z.string())).min(1, "Please enter at least one size"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
  rating: z.coerce.number().min(0).max(5).default(0),
  onWebsite: z.boolean().default(true),
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

export async function addProductAction(formData: FormData) {
  
  const files = [
    formData.get('image1') as File,
    formData.get('image2') as File,
    formData.get('image3') as File,
    formData.get('image4') as File,
  ].filter(file => file && file.size > 0);

  const rawData = {
      name: formData.get('name'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory'),
      colors: (formData.get('colors') as string || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      sizes: (formData.get('sizes') as string || '').split(',').map((s: string) => s.trim().split(' ')).filter(parts => parts.length > 0),
      price: formData.get('price'),
      quantity: formData.get('quantity'),
      rating: formData.get('rating'),
      onWebsite: formData.get('onWebsite') === 'true',
      status: Number(formData.get('quantity')) > 0 ? "In Stock" : "Out of Stock",
  };

  const validation = productSchema.safeParse(rawData);

  if (!validation.success) {
    console.error("Validation Errors:", validation.error.flatten().fieldErrors);
    return { success: false, message: 'Invalid data.', errors: validation.error.flatten().fieldErrors };
  }

  try {
    const { uploadedUrls, imageHints } = await uploadToImageKit(files, validation.data.name, validation.data.brand);

    const db = await getDb();
    const result = await db.collection('items').insertOne({ 
        ...validation.data, 
        desc: validation.data.description,
        images: uploadedUrls,
        imageHints: imageHints
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

export async function updateProductAction(productId: string, formData: FormData) {
    const files = [
      formData.get('image1') as File,
      formData.get('image2') as File,
      formData.get('image3') as File,
      formData.get('image4') as File,
    ].filter(file => file && file.size > 0);

    const rawData: any = {
      name: formData.get('name'),
      brand: formData.get('brand'),
      description: formData.get('description'),
      category: formData.get('category'),
      subCategory: formData.get('subCategory'),
      price: formData.get('price'),
      quantity: formData.get('quantity'),
      rating: formData.get('rating'),
      onWebsite: formData.get('onWebsite') === 'true',
    };

    const colorsStr = formData.get('colors') as string;
    if (colorsStr) {
      rawData.colors = colorsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    const sizesStr = formData.get('sizes') as string;
    if (sizesStr) {
      rawData.sizes = sizesStr.split(',').map((s: string) => s.trim().split(' ')).filter(parts => parts.length > 0);
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

        if (files.length > 0 && validation.data.name && validation.data.brand) {
          const { uploadedUrls, imageHints } = await uploadToImageKit(files, validation.data.name, validation.data.brand);
          // This example replaces existing images.
          updateData.images = uploadedUrls;
          updateData.imageHints = imageHints;
        }

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
