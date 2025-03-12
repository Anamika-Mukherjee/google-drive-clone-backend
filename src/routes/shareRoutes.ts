import express from "express";
import addAccesser from "../controllers/addAccesser";
import removeAccesser from "../controllers/removeAccesser";
import accesserList from "../controllers/accesserList";

const router = express.Router();

//route to add accesser
router.post("/add-accesser", addAccesser);

//route to remove accesser
router.post("/remove-accesser", removeAccesser);

//route to list accesser details
router.post("/accesser-list", accesserList);

export default router;