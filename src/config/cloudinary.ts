import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse
} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY as string
});

const uploadImageCloudinary = async (
  image: Express.Multer.File
): Promise<UploadApiResponse> => {
  if (!image) {
    throw new Error("No image provided for upload.");
  }

  const buffer = image.buffer;

  const uploadedImage = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "binkeyit" },
        (
          error: UploadApiErrorResponse | null | undefined,
          result: UploadApiResponse | null | undefined
        ) => {
          if (error) {
            return reject(
              new Error(`Cloudinary upload failed: ${error.message}`)
            );
          }
          if (!result) {
            return reject(new Error("Cloudinary upload returned no result."));
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    }
  );

  return uploadedImage;
};

export default uploadImageCloudinary;
