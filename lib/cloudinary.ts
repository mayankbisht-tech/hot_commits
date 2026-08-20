import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Upload a buffer or base64 file to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer | string,
  options?: {
    folder?: string;
    resource_type?: 'auto' | 'image' | 'raw' | 'video';
    public_id?: string;
  }
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'tpc-platform',
        resource_type: options?.resource_type || 'auto',
        public_id: options?.public_id,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    if (Buffer.isBuffer(fileBuffer)) {
      uploadStream.end(fileBuffer);
    } else {
      cloudinary.uploader.upload(
        fileBuffer,
        {
          folder: options?.folder || 'tpc-platform',
          resource_type: options?.resource_type || 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    }
  });
}
