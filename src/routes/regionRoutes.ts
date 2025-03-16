import { Router } from "express";
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from "../controllers/regionController";

const router = Router();

router.post("/regions", createRegion);
router.get("/regions", getRegions);
router.get("/regions/:id", getRegionById);
router.put("/regions/:id", updateRegion);
router.delete("/regions/:id", deleteRegion);

export default router;
