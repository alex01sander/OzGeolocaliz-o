import { Request, Response } from "express";
import { UserModel } from "../models/user";
import lib from "../utils/lib";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, address, coordinates } = req.body;
    console.log(
      `Iniciando criação de usuário - Nome: ${name}, Email: ${email}`,
    );

    if (address && coordinates) {
      console.warn("Tentativa de criação de usuário inválida");
      return res.status(400).json({
        message: "Você deve fornecer endereço ou coordenadas, mas não ambos.",
      });
    }

    if (!address && !coordinates) {
      console.warn(
        "Tentativa de criação de usuário sem endereço ou coordenadas",
      );
      return res
        .status(400)
        .json({ message: "Forneça endereço ou coordenadas." });
    }

    const userData: any = { name, email };

    if (address) {
      userData.address = address;
      const coords = await lib.getCoordinatesFromAddress(address);
      userData.coordinates = [coords[1], coords[0]];
    }

    if (coordinates) {
      userData.coordinates = [coordinates[1], coordinates[0]];
      userData.address = await lib.getAddressFromCoordinates(coordinates);
    }

    try {
      const user = new UserModel(userData);
      await user.save();
      console.log(
        `Usuário criado com sucesso - ID: ${user._id}, Email: ${user.email}`,
      );
      return res.status(201).json(user);
    } catch (saveError) {
      console.error("Erro ao salvar usuário:", saveError);
      return res.status(500).json({
        message: "Erro ao salvar usuário",
        error: saveError.message,
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
