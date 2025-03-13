import { Request, Response } from "express";
import { UserModel } from "../models/user";
import lib from "../utils/lib";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, address, coordinates } = req.body;

    console.log(
      `Iniciando criação de usuário - Nome: ${name}, Email: ${email}`,
    );

    if (!address && !coordinates) {
      console.warn(
        "Tentativa de criação de usuário sem endereço ou coordenadas",
      );
      return res
        .status(400)
        .json({ message: "Forneça endereço ou coordenadas." });
    }

    let resolvedCoordinates = coordinates;
    let resolvedAddress = address;

    if (address && !coordinates) {
      try {
        const [lat, lng] = await lib.getCoordinatesFromAddress(address);
        resolvedCoordinates = [lng, lat];
        console.log(
          `Coordenadas resolvidas - Endereço: ${address}, Coordenadas: ${resolvedCoordinates}`,
        );
      } catch (geoError) {
        console.error("Erro ao resolver coordenadas:", geoError);
        return res.status(500).json({
          message: "Erro ao resolver coordenadas",
        });
      }
    }

    if (coordinates && !address) {
      try {
        resolvedAddress = await lib.getAddressFromCoordinates(coordinates);
        console.log(
          `Endereço resolvido - Coordenadas: ${coordinates}, Endereço: ${resolvedAddress}`,
        );
      } catch (geoError) {
        console.error("Erro ao resolver endereço:", geoError);
        return res.status(500).json({
          message: "Erro ao resolver endereço",
        });
      }
    }

    const user = new UserModel({
      name,
      email,
      address: resolvedAddress,
      coordinates: resolvedCoordinates,
    });

    try {
      await user.save();
      console.log(
        `Usuário criado com sucesso - ID: ${user._id}, Email: ${user.email}`,
      );
      return res.status(201).json(user);
    } catch (saveError) {
      console.error("Erro ao salvar usuário:", saveError);
      return res.status(500).json({
        message: "Erro ao salvar usuário",
      });
    }
  } catch (error) {
    console.error("Erro inesperado na criação de usuário:", error);
    return res.status(500).json({
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
};
