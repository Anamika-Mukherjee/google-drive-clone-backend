import express from "express";
import multer from "multer";
import { editFile, uploadEdit } from "../controllers/fileEdit";

const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//route to generate signed upload url to edit file
router.post("/edit-file", editFile);

//route to upload file to signed upload url
router.post("/upload-edit", upload.single("file"), uploadEdit);
  
export default router;