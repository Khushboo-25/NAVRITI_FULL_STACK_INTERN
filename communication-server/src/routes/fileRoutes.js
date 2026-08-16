import express from "express";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", upload.single("file"), (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    const fileUrl =
        `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(200).json({
        message: "File uploaded successfully",

        file: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            fileUrl
        }
    });
});

export default router;