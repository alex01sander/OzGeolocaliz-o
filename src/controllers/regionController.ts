import { Request, Response } from "express";
import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";

export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const region = new RegionModel({
      name,
      coordinates,
      user: userId,
      location: { type: "Polygon", coordinates },
    });

    await region.save();

    return res.status(201).json(region);
  } catch (error) {
    console.error("Error creating region:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRegions = async (req: Request, res: Response) => {
  try {
    const regions = await RegionModel.find().lean();
    return res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return res.status(500).json({ message: "Error fetching regions" });
  }
};

export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const region = await RegionModel.findById(id).lean();
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    return res.status(200).json(region);
  } catch (error) {
    console.error(`Error fetching region - ID: ${id}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, coordinates } = req.body;

  try {
    const region = await RegionModel.findById(id);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    if (name) region.name = name;
    if (coordinates) region.coordinates = coordinates;

    await region.save();

    return res.status(200).json(region);
  } catch (error) {
    console.error(`Error updating region - ID: ${id}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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
