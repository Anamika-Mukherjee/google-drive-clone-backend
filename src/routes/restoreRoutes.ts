import express from "express";
import fileRestore from "../controllers/fileRestore";

const router = express.Router();

//route for file restore from trash
router.post("/file-restore", fileRestore);

export default router;
