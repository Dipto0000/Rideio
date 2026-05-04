import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: (req, file) => {
        const fileName = file.originalname
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/\./g, "-")
            .replace(/[^a-z0-9\-\.]/g, "");

        const extension = file.originalname.split(".").pop();
        const uniqueFileName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName + "." + extension;

        return {
            public_id: uniqueFileName,
            folder: "profile-pictures",
            resource_type: "image" as const,
        };
    },
});

export const multerUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase().split(".").pop() || "");
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
    },
});
