import { Request, Response } from "express";
import regionService from "../services/regionService";
import { StatusCodes } from "http-status-codes";

export const createRegion = async (req: Request, res: Response) => {
  try {
    const region = await regionService.createRegion(req.body);
    return res.status(StatusCodes.CREATED).json(region);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error creating region", error: error.message });
  }
};

export const getRegions = async (req: Request, res: Response) => {
  try {
    const regions = await regionService.getRegions();
    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching regions", error: error.message });
  }
};

export const getRegionById = async (req: Request, res: Response) => {
  try {
    const region = await regionService.getRegionById(req.params.id);
    if (!region) return res.status(404).json({ message: "Region not found" });
    return res.status(StatusCodes.OK).json(region);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error querying region", error: error.message });
  }
};

export const updateRegion = async (req: Request, res: Response) => {
  try {
    const updatedRegion = await regionService.updateRegion(
      req.params.id,
      req.body,
    );
    if (!updatedRegion)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Region not found" });
    return res.status(StatusCodes.OK).json(updatedRegion);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating region", error: error.message });
  }
};

export const deleteRegion = async (req: Request, res: Response) => {
  try {
    const deletedRegion = await regionService.deleteRegion(req.params.id);
    if (!deletedRegion)
      return res.status(404).json({ message: "Region not found" });
    return res.status(200).json({ message: "Region successfully deleted" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error deleting region", error: error.message });
  }
};

export const findRegionsContainingPoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const { longitude, latitude } = req.query;
    const regions = await regionService.findRegionsContainingPoint(
      parseFloat(longitude as string),
      parseFloat(latitude as string),
    );
    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error finding regions", error: error.message });
  }
};

export const findRegionsNearPoint = async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;
    const regions = await regionService.findRegionsNearPoint(
      parseFloat(longitude as string),
      parseFloat(latitude as string),
      parseFloat(maxDistance as string),
    );
    return res.status(StatusCodes.OK).json(regions);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error finding regions near point",
      error: error.message,
    });
  }
};
