import { Request, Response } from "express";
import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";
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
 *         location:
 *           type: object
 *           description: GeoJSON Polygon representing the location of the region
 *           properties:
 *             type:
 *               type: string
 *               description: The type of the location (Polygon)
 *             coordinates:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: number
 *               description: Array of coordinates defining the region's boundaries
 *       required:
 *         - name
 *         - location
 */

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Create a new region
 *     description: Creates a new region with name and location (GeoJSON polygon).
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
 *               name: 'North Region'
 *               location:
 *                 type: "Polygon"
 *                 coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
      return res.status(400).json({
        message: "Coordinates must be a valid GeoJSON polygon array",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const region = new RegionModel({
      name,
      user: userId,
      location: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    });

    await region.save();

    return res.status(201).json(region);
  } catch (error) {
    console.error("Error creating region:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Get all regions
 *     description: Retrieves all regions from the database.
 *     responses:
 *       200:
 *         description: List of all regions
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: 'North Region'
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *                 createdAt: '2025-03-16T12:00:00Z'
 *               - id: 2
 *                 name: 'South Region'
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[30.7128, -60.0060], [30.7138, -60.0050], [30.7118, -60.0050], [30.7128, -60.0060]]]
 *                 createdAt: '2025-03-16T12:00:00Z'
 *       500:
 *         description: Internal server error
 */

export const getRegions = async (req: Request, res: Response) => {
  try {
    const regions = await RegionModel.find().lean();
    return res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return res.status(500).json({ message: "Error fetching regions" });
  }
};

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
 *         description: ID of the region to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region found
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'North Region'
 *               location:
 *                 type: "Polygon"
 *                 coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               createdAt: '2025-03-16T12:00:00Z'
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */
export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Tentando buscar região com ID: ${id}`);

  try {
    console.log(`Executando consulta no MongoDB para ID: ${id}`);
    const region = await RegionModel.findById(id).lean();
    console.log(`Resultado da consulta:`, region);

    if (!region) {
      console.log(`Região não encontrada para ID: ${id}`);
      return res.status(404).json({ message: "Region not found" });
    }

    console.log(`Região encontrada com sucesso para ID: ${id}`);
    return res.status(200).json(region);
  } catch (error) {
    console.error(`Erro ao buscar região - ID: ${id}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /regions/{id}:
 *   put:
 *     summary: Update an existing region
 *     description: Updates the details of an existing region by ID.
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
 *               name: 'Updated North Region'
 *               location:
 *                 type: "Polygon"
 *                 coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Region not found
 *       500:
 *         description: Internal server error
 */

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, coordinates } = req.body;

  try {
    const region = await RegionModel.findById(id);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    if (name) region.name = name;

    if (coordinates) {
      // Certifique-se de construir o GeoJSON corretamente
      if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
        return res.status(400).json({
          message: "Coordinates must be a valid GeoJSON polygon array",
        });
      }

      region.location = {
        type: "Polygon",
        coordinates: [coordinates],
      };
    }

    await region.save();

    return res.status(200).json(region);
  } catch (error) {
    console.error(`Error updating region - ID: ${id}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Delete a region by ID
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
export const deleteRegion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const region = await RegionModel.findByIdAndDelete(id);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    return res.status(200).json({ message: "Region successfully deleted" });
  } catch (error) {
    console.error(`Error deleting region - ID: ${id}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /regions/point:
 *   get:
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
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               - id: 2
 *                 name: 'South Region'
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[30.7128, -60.0060], [30.7138, -60.0050], [30.7118, -60.0050], [30.7128, -60.0060]]]
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Internal server error
 */
export const findRegionsContainingPoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res
        .status(400)
        .json({ message: "Coordinates out of valid range" });
    }

    const regions = await RegionModel.find({
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
    }).lean();

    return res.status(200).json(regions);
  } catch (error) {
    console.error("Error finding regions containing point:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /regions/near:
 *   get:
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
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               - id: 2
 *                 name: 'South Region'
 *                 location:
 *                   type: "Polygon"
 *                   coordinates: [[[30.7128, -60.0060], [30.7138, -60.0050], [30.7118, -60.0050], [30.7128, -60.0060]]]
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
export const findRegionsNearPoint = async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, maxDistance, onlyUserRegions } = req.query;
    const userId = req.query.userId as string;

    if (!longitude || !latitude || !maxDistance) {
      return res.status(400).json({
        message: "Longitude, latitude, and maxDistance are required",
      });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);
    const distance = parseFloat(maxDistance as string);

    if (isNaN(lng) || isNaN(lat) || isNaN(distance)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res
        .status(400)
        .json({ message: "Coordinates out of valid range" });
    }

    const query: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distance,
        },
      },
    };

    if (onlyUserRegions === "true" && userId) {
      query.user = userId;
    }

    const regions = await RegionModel.find(query).lean();

    return res.status(200).json(regions);
  } catch (error) {
    console.error("Error finding regions near point:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
