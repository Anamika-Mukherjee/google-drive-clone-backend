import express from "express";
import multer from "multer";
import fileUpload from "../controllers/fileUpload";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//route to upload file
router.post("/file-upload", upload.single("file"), fileUpload);

export default router;