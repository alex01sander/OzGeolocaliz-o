import { Router } from "express";
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
  findRegionsContainingPoint,
  findRegionsNearPoint,
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
 *     tags: [Regions]
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
 *     tags: [Regions]
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
 *     tags: [Regions]
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
 *   patch:
 *     tags: [Regions]
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
router.patch("/regions/:id", updateRegion);

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     tags: [Regions]
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
/**
 * @swagger
 * /regions/point:
 *   get:
 *     tags: [Regions]
 *     summary: Find regions containing a specific point
 *     description: Finds regions that contain the specified point (longitude and latitude).
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         description: Longitude of the point
 *         schema:
 *           type: number
 *       - in: query
 *         name: latitude
 *         required: true
 *         description: Latitude of the point
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of regions containing the point
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: 'North Region'
 *                 country: 'Brazil'
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Internal server error
 */
router.get("/regions/point", findRegionsContainingPoint);
/**
 * @swagger
 * /regions/near:
 *   get:
 *     tags: [Regions]
 *     summary: Find regions near a point
 *     description: Finds regions within a specified distance from a point (longitude, latitude).
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         description: Longitude of the point
 *         schema:
 *           type: number
 *       - in: query
 *         name: latitude
 *         required: true
 *         description: Latitude of the point
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         required: true
 *         description: Maximum distance from the point (in meters)
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of regions near the point
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: 'North Region'
 *                 country: 'Brazil'
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get("/regions/near", findRegionsNearPoint);
export default router;
