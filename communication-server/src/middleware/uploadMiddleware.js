import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}` +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        // Images
        "image/jpeg",
        "image/png",
        "image/webp",

        // Documents
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // Excel
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        // ZIP
        "application/zip",
        "application/x-zip-compressed"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File type not allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB
    }
});

export default upload;