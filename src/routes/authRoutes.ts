import express from "express";
import signUp from "../controllers/signUp";
import signIn from "../controllers/signIn";
import signOut from "../controllers/signOut";

const router = express.Router();

//sign up route
router.post("/signup", signUp);

//sign in route
router.post("/signin", signIn);

//sign out route
router.get("/signout", signOut);

export default router;