import express from "express";
import fileRename from "../controllers/fileRename";

const router = express.Router();

//route to rename file
router.post("/file-rename", fileRename);

export default router;