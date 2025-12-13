import express from 'express'
import { getAllDonates, createDonate, updateDonate, deleteDonate } from "../controllers/donateControllers.js";    

const router = express.Router();

router.get("/", getAllDonates) ;

router.post("/", createDonate);

router.put("/:id", updateDonate);

router.delete("/:id", deleteDonate);

export default router;
