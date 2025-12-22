
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(fileBuffer: Buffer, productId: string, imageIndex: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id: `${productId}_image_${imageIndex}`,
                folder: 'kosh_products',
                overwrite: true,
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    reject(new Error('Failed to upload image to Cloudinary.'));
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Cloudinary returned no result or error.'));
                }
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}
