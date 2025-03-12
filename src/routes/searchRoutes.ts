import express from "express";
import search from "../controllers/search";

const router = express.Router();

//file search route
router.get("/search", search);

export default router;