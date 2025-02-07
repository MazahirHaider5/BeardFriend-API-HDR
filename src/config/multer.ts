import multer from "multer";
import path from "path";
import fs from "fs";

const createMulterUploader = (allowedTypes: string[], uploadFolder: string) => {
  const ensureDirectoryExists = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true }); // Create directory if it doesn't exist
    }
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join("uploads", uploadFolder);
      ensureDirectoryExists(uploadPath); // Ensure directory exists
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const filename = `${Date.now()}${fileExtension}`;
      cb(null, filename);
    }
  });

  const fileFilter = (req: any, file: any, cb: any) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}.`
        ),
        false
      );
    }
  };

  return multer({ storage, fileFilter });
};

export default createMulterUploader;
