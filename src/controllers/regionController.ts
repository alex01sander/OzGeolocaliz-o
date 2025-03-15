// controllers/regionController.ts
import { Request, Response } from "express";
import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";

export const createRegion = async (req: Request, res: Response) => {
  try {
    const { name, coordinates, userId } = req.body;

    if (!name || !coordinates || !userId) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const region = new RegionModel({
      name,
      coordinates,
      user: userId,
      location: { type: "Polygon", coordinates },
    });

    await region.save(); // O pre-save hook já irá adicionar a região ao usuário

    return res.status(201).json(region);
  } catch (error) {
    console.error("Erro ao criar região:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getRegions = async (req: Request, res: Response) => {
  try {
    const regions = await RegionModel.find().lean();
    return res.status(200).json(regions);
  } catch (error) {
    console.error("Erro ao buscar regiões:", error);
    return res.status(500).json({ message: "Erro ao buscar regiões" });
  }
};

export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const region = await RegionModel.findById(id).lean();
    if (!region) {
      return res.status(404).json({ message: "Região não encontrada" });
    }

    return res.status(200).json(region);
  } catch (error) {
    console.error(`Erro ao buscar região - ID: ${id}`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, coordinates } = req.body;

  try {
    const region = await RegionModel.findById(id);
    if (!region) {
      return res.status(404).json({ message: "Região não encontrada" });
    }

    if (name) region.name = name;
    if (coordinates) region.coordinates = coordinates;

    await region.save();

    return res.status(200).json(region);
  } catch (error) {
    console.error(`Erro ao atualizar região - ID: ${id}`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const deleteRegion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const region = await RegionModel.findByIdAndDelete(id);
    if (!region) {
      return res.status(404).json({ message: "Região não encontrada" });
    }

    return res.status(200).json({ message: "Região deletada com sucesso" });
  } catch (error) {
    console.error(`Erro ao deletar região - ID: ${id}`, error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
