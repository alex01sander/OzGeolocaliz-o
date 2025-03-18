import { Request, Response } from "express";
import { RegionService } from "../services/regionService";
import { StatusCodes } from "http-status-codes";

export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Missing required fields" });
    }

    const region = await RegionService.createRegion(name, coordinates, userId);
    return res.status(StatusCodes.CREATED).json(region);
  } catch (error) {
    console.error("Error creating region:", error);
    return res
      .status(error.message.includes("not found") ? 404 : 400)
      .json({ message: error.message });
  }
};

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

export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Attempting to fetch region with ID: ${id}`);

  try {
    console.log(`Executing MongoDB query for ID: ${id}`);
    const region = await RegionService.getRegionById(id);
    console.log(`Region successfully found for ID: ${id}`);
    return res.status(StatusCodes.OK).json(region);
  } catch (error) {
    console.error(`Error fetching region - ID: ${id}`, error);
    return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
  }
};

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, coordinates } = req.body;

  try {
    const region = await RegionService.updateRegion(id, name, coordinates);
    return res.status(StatusCodes.OK).json(region);
  } catch (error) {
    console.error(`Error updating region - ID: ${id}`, error);
    return res.status(error.message.includes("not found") ? 404 : 400).json({
      message: error.message,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteRegion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await RegionService.deleteRegion(id);
    return res
      .status(StatusCodes.OK)
      .json({ message: "Region successfully deleted" });
  } catch (error) {
    console.error(`Error deleting region - ID: ${id}`, error);
    return res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
  }
};

export const findRegionsContainingPoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Longitude and latitude are required" });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);

    if (isNaN(lng) || isNaN(lat)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
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

export const findRegionsNearPoint = async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, maxDistance, onlyUserRegions } = req.query;
    const userId = req.query.userId as string;

    if (!longitude || !latitude || !maxDistance) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Longitude, latitude, and maxDistance are required",
      });
    }

    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);
    const distance = parseFloat(maxDistance as string);

    if (isNaN(lng) || isNaN(lat) || isNaN(distance)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
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
