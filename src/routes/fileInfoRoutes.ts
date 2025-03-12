import express from "express";
import fileList from "../controllers/fileList";
import fileListType from "../controllers/fileListType";
import sharedList from "../controllers/sharedList";
import trashList from "../controllers/trashList";
import storageUsage from "../controllers/storageUsage";

const router = express.Router();

//route to list all files
router.get("/file-list", fileList);

//route to list files by types
router.post("/file-list-type", fileListType);

//route to list shared files
router.get("/shared-list", sharedList);

//route to list trash files
router.get("/trash-list", trashList);

//route to retrieve storage usage information
router.get("/storage-usage", storageUsage);

export default router;