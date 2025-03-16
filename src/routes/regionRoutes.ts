import { Router } from "express";
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from "../controllers/regionController";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Region:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the region
 *         country:
 *           type: string
 *           description: Country where the region is located
 *       required:
 *         - name
 *         - country
 */

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Create a new region
 *     description: Creates a new region with name and country.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Region'
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'North'
 *               country: 'Brazil'
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/regions", createRegion);

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Get all regions
 *     description: Retrieves a list of all regions.
 *     responses:
 *       200:
 *         description: List of regions
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: 'North'
 *                 country: 'Brazil'
 *                 createdAt: '2025-03-16T12:00:00Z'
 *               - id: 2
 *                 name: 'South'
 *                 country: 'Brazil'
 *                 createdAt: '2025-03-16T12:00:00Z'
 *       500:
 *         description: Internal server error
 */
router.get("/regions", getRegions);

/**
 * @swagger
 * /regions/{id}:
 *   get:
 *     summary: Get a region by ID
 *     description: Retrieves a region by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the region
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region found
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'North'
 *               country: 'Brazil'
 *               createdAt: '2025-03-16T12:00:00Z'
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
router.get("/regions/:id", getRegionById);

/**
 * @swagger
 * /regions/{id}:
 *   put:
 *     summary: Update a region
 *     description: Updates the details of a region by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the region to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Region'
 *     responses:
 *       200:
 *         description: Region updated successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'North Updated'
 *               country: 'Brazil'
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
router.put("/regions/:id", updateRegion);

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Delete a region
 *     description: Deletes a region by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the region to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region deleted successfully
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
router.delete("/regions/:id", deleteRegion);

export default router;
