import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";

type Coordinate = [number, number];

/**
 * @swagger
 * components:
 *   schemas:
 *     Region:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique region ID
 *         name:
 *           type: string
 *           description: Name of the region
 *         user:
 *           type: string
 *           description: ID of the region owner
 *         location:
 *           type: object
 *           description: GeoJSON location object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Polygon]
 *               description: Geometry type (Polygon)
 *             coordinates:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 2
 *                 maxItems: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         name: "Downtown São Paulo"
 *         user: "60d21b4667d0d8992e610c86"
 *         location:
 *           type: "Polygon"
 *           coordinates: [[[-46.633308, -23.550520], [-46.634000, -23.551000], [-46.632000, -23.552000], [-46.631000, -23.551500], [-46.633308, -23.550520]]]
 *         createdAt: "2023-05-12T15:30:45.123Z"
 *         updatedAt: "2023-05-12T15:30:45.123Z"
 */

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Get all regions
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: List of regions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 *   post:
 *     summary: Create a new region
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
 *               coordinates:
 *                 type: array
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Region created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 * /regions/{id}:
 *   get:
 *     summary: Get region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *   patch:
 *     summary: Update region
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               coordinates:
 *                 type: array
 *     responses:
 *       200:
 *         description: Region updated
 *   delete:
 *     summary: Delete region
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region deleted
 */

export class RegionService {
  static async createRegion(
    name: string,
    coordinates: Coordinate[],
    userId: string,
  ) {
    if (!coordinates || !Array.isArray(coordinates)) {
      throw new Error("Coordinates are required and must be an array");
    }

    if (
      coordinates.length < 4 ||
      coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]
    ) {
      throw new Error(
        "Coordinates must form a valid, closed GeoJSON Polygon with at least 4 points.",
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
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
    return region;
  }

  static async updateRegion(
    id: string,
    name?: string,
    coordinates?: Coordinate[],
  ) {
    const region = await RegionModel.findById(id);
    if (!region) {
      return null;
    }

    if (name) region.name = name;

    if (coordinates) {
      if (!Array.isArray(coordinates)) {
        throw new Error("Coordinates must be a valid array");
      }

      let validCoordinates: Coordinate[] = [...coordinates];
      if (
        !validCoordinates.length ||
        validCoordinates[0][0] !==
          validCoordinates[validCoordinates.length - 1][0] ||
        validCoordinates[0][1] !==
          validCoordinates[validCoordinates.length - 1][1]
      ) {
        validCoordinates.push([...validCoordinates[0]]);
      }

      if (validCoordinates.length < 4) {
        throw new Error(
          "A polygon must have at least 4 points (including the closing point)",
        );
      }

      region.location = {
        type: "Polygon",
        coordinates: [validCoordinates],
      };
    }

    await region.save();
    return region;
  }

  static async getRegions() {
    return await RegionModel.find().lean();
  }

  static async getRegionById(id: string) {
    const region = await RegionModel.findById(id).lean();
    if (!region) {
      return null;
    }
    return region;
  }

  static async deleteRegion(id: string) {
    const region = await RegionModel.findByIdAndDelete(id);
    if (!region) {
      return null;
    }
    return region;
  }

  static async findRegionsContainingPoint(longitude: number, latitude: number) {
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error("Coordinates out of valid range");
    }

    return await RegionModel.find({
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
    }).lean();
  }

  static async findRegionsNearPoint(
    longitude: number,
    latitude: number,
    maxDistance: number,
    onlyUserRegions?: boolean,
    userId?: string,
  ) {
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error("Coordinates out of valid range");
    }

    const query: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    if (onlyUserRegions && userId) {
      query.user = userId;
    }

    return await RegionModel.find(query).lean();
  }
}
