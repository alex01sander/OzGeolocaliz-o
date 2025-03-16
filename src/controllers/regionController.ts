import { Request, Response } from "express";
import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";

export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validar formato das coordenadas
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

// Função para encontrar regiões que contêm um ponto específico
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

    // Consulta para encontrar regiões que contêm o ponto
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

// Função para encontrar regiões dentro de uma distância de um ponto
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

    // Construir o filtro base
    const query: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distance, // em metros
        },
      },
    };

    // Adicionar filtro de usuário se solicitado
    if (onlyUserRegions === "true" && userId) {
      query.user = userId;
    }

    // Executar a consulta
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
