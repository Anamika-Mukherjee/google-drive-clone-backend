import express from "express";
import fileTrash from "../controllers/fileTrash";
import fileDelete from "../controllers/fileDelete";

const router = express.Router();

//route for soft delete (move files to trash)
router.post("/file-trash", fileTrash);

//route for permanent deletion
router.post("/file-delete", fileDelete);

export default router;