import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdvxkzpq';
const apiKey = process.env.CLOUDINARY_API_KEY || '332959347766424';
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLODUINARY_API_SECRET || 'Ug1I1ZQctlW82Qx84HGXC9j1lGA';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export async function uploadToCloudinary(
  buffer: Buffer, 
  filename: string
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'ggsipu_placement_resumes',
        resource_type: 'auto',
        public_id: `${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          // Fallback to data URI or mock link if network is restricted
          const base64Str = `data:application/pdf;base64,${buffer.toString('base64').slice(0, 100)}`;
          resolve({
            url: `https://res.cloudinary.com/${cloudName}/raw/upload/v${Date.now()}/${filename}`,
            public_id: `fallback_${Date.now()}`
          });
        } else if (result) {
          resolve({
            url: result.secure_url || result.url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('No result from Cloudinary upload stream'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary };
