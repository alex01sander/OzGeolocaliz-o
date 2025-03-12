import { Request, Response } from "express";
import { UserModel } from "../models/user";
import lib from "../utils/lib";

export const createUser = async (req: Request, res: Response) => {
  const { name, email, address, coordinates } = req.body;

  if (!address && !coordinates) {
    return res
      .status(400)
      .json({ message: "Forneça endereço ou coordenadas." });
  }

  let resolvedCoordinates = coordinates;
  if (address && !coordinates) {
    const [lat, lng] = await lib.getCoordinatesFromAddress(address);
    resolvedCoordinates = [lng, lat];
  }

  let resolvedAddress = address;
  if (coordinates && !address) {
    resolvedAddress = await lib.getAddressFromCoordinates(coordinates);
  }

  const user = new UserModel({
    name,
    email,
    address: resolvedAddress,
    coordinates: resolvedCoordinates,
  });

  await user.save();
  return res.status(201).json(user);
};
