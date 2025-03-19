import { Request, Response } from "express";
import { RegionService } from "../services/regionService";
import { StatusCodes } from "http-status-codes";

/**
 * @swagger
 * components:
 *   schemas:
 *     Region:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique geographic region ID
 *         name:
 *           type: string
 *           description: Name of the region
 *         coordinates:
 *           type: array
 *           description: Array of coordinates forming the region's polygon
 *           items:
 *             type: array
 *             items:
 *               type: number
 *             minItems: 2
 *             maxItems: 2
 *             example: [[-46.633308, -23.550520], [-46.634000, -23.551000], [-46.632000, -23.552000], [-46.633308, -23.550520]]
 *         userId:
 *           type: string
 *           description: User ID of the region owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last record update date
 *       required:
 *         - name
 *         - coordinates
 *         - userId
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         name: "Downtown São Paulo"
 *         coordinates: [
 *           [-46.633308, -23.550520],
 *           [-46.634000, -23.551000],
 *           [-46.632000, -23.552000],
 *           [-46.633308, -23.550520]
 *         ]
 *         userId: "60d21b4667d0d8992e610c86"
 *         createdAt: "2023-05-12T15:30:45.123Z"
 *         updatedAt: "2023-05-12T15:30:45.123Z"
 */

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Creates a new region
 *     description: Creates a new geographic region with a name, coordinates, and associated with a user
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinates
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the region
 *               coordinates:
 *                 type: array
 *                 description: Array of coordinates forming the region's polygon
 *               userId:
 *                 type: string
 *                 description: ID of the user who owns the region
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       400:
 *         description: Invalid data or error creating the region
 *       404:
 *         description: User not found
 *       500:
 *         description: Missing required fields
 */
export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json({ message: "Missing required fields" });
    }

    const region = await RegionService.createRegion(name, coordinates, userId);
    return res.status(StatusCodes.CREATED).json(region);
  } catch (error) {
    console.error("Error creating region:", error);
    let statusCode;

    if (error.message.includes("not found")) {
      statusCode = StatusCodes.NOT_FOUND;
    } else if (error.message.includes("Invalid coordinates")) {
      statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    } else {
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    return res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Get all regions
 *     description: Returns a list of all registered regions
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: List of regions successfully returned
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 *       500:
 *         description: Internal error while fetching regions
 */
export const getRegions = async (req: Request, res: Response) => {
  try {
    const regions = await RegionService.getRegions();
    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching regions" });
  }
};
/**
 * @swagger
 * /regions/{id}:
 *   get:
 *     summary: Get region by ID
 *     description: Returns a specific region by its ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the region
 *     responses:
 *       200:
 *         description: Region found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       404:
 *         description: Region not found
 */

export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const region = await RegionService.getRegionById(id);

  if (!region) {
    return res.status(404).json({ message: "Region not found" });
  }

  return res.status(200).json(region);
};

/**
 * @swagger
 * /regions/{id}:
 *   patch:
 *     summary: Update region
 *     description: Updates the data of an existing region
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the region to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name of the region
 *               coordinates:
 *                 type: array
 *                 description: New coordinates for the region
 *     responses:
 *       200:
 *         description: Region updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       400:
 *         description: Invalid data for update
 *       404:
 *         description: Region not found
 */

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, coordinates } = req.body;

  const region = await RegionService.updateRegion(id, name, coordinates);

  if (!region) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Region not found" });
  }

  return res.status(StatusCodes.OK).json(region);
};

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Delete region
 *     description: Removes a region by its ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the region to be deleted
 *     responses:
 *       200:
 *         description: Region successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Region successfully deleted
 *       404:
 *         description: Region not found
 */

export const deleteRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const region = await RegionService.deleteRegion(id);

  if (!region) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Region not found" });
  }

  return res
    .status(StatusCodes.OK)
    .json({ message: "Region successfully deleted" });
};

/**
 * @swagger
 * /regions/containing-point:
 *   get:
 *     summary: Find regions containing a point
 *     description: Returns all regions that contain a specific geographic point
 *     tags: [Regions]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the geographic point
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the geographic point
 *     responses:
 *       200:
 *         description: List of regions containing the point
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 *       400:
 *         description: Invalid or missing coordinate parameters
 *       500:
 *         description: Internal error while processing the request
 */

export const findRegionsContainingPoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json({ message: "Longitude and latitude are required" });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);

    if (isNaN(lng) || isNaN(lat)) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json({ message: "Invalid coordinates" });
    }

    const regions = await RegionService.findRegionsContainingPoint(lng, lat);
    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    console.error("Error finding regions containing point:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * @swagger
 * /regions/near-point:
 *   get:
 *     summary: Find nearby regions to a point
 *     description: Returns all regions within a maximum distance from a geographic point
 *     tags: [Regions]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the geographic point
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the geographic point
 *       - in: query
 *         name: maxDistance
 *         required: true
 *         schema:
 *           type: number
 *         description: Maximum distance in meters
 *       - in: query
 *         name: onlyUserRegions
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter only user regions
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: User ID (required if onlyUserRegions=true)
 *     responses:
 *       200:
 *         description: List of regions near the point
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 *       400:
 *         description: Invalid or missing parameters
 *       500:
 *         description: Internal error processing the request
 */

export const findRegionsNearPoint = async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, maxDistance, onlyUserRegions } = req.query;
    const userId = req.query.userId as string;

    if (!longitude || !latitude || !maxDistance) {
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        message: "Longitude, latitude, and maxDistance are required",
      });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);
    const distance = parseFloat(maxDistance as string);

    if (isNaN(lng) || isNaN(lat) || isNaN(distance)) {
      return res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json({ message: "Invalid parameters" });
    }

    const regions = await RegionService.findRegionsNearPoint(
      lng,
      lat,
      distance,
      onlyUserRegions === "true",
      userId,
    );

    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    console.error("Error finding regions near point:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
