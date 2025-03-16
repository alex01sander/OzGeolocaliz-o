import { Router } from "express";
import {
  createUser,
  deleteUser,
  updateUser,
} from "../controllers/userController";

const router = Router();

router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
