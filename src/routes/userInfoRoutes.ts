import express from "express";
import userInfo from "../controllers/userInfo";

const router = express.Router();

//route to retrieve user information
router.get("/dashboard", userInfo);

export default router;