import { Request, Response } from "express";
import userService from "../services/userService";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/user";
import lib from "../utils/lib";

export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    if (
      !userData.address &&
      (!userData.coordinates || userData.coordinates.length !== 2)
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Provide address or coordinates." });
    }

    if (userData.address && !userData.coordinates) {
      try {
        const coordinates = await lib.getCoordinatesFromAddress(
          userData.address,
        );
        if (!coordinates) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal server error",
            error: "Coordinates not found for the address.",
          });
        }
        userData.coordinates = coordinates;
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Internal server error",
          error: "Failed to retrieve coordinates",
        });
      }
    }

    if (userData.coordinates && !userData.address) {
      try {
        const address = await lib.getAddressFromCoordinates(
          userData.coordinates,
        );
        if (!address) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal server error",
            error: "Address not found for coordinates.",
          });
        }
        userData.address = address;
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Internal server error",
          error: "Failed to retrieve address",
        });
      }
    }

    const user = await userService.createUser(userData);

    return res.status(StatusCodes.CREATED).json(user);
  } catch (error) {
    console.error("Error creating user:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, name, email } = req.query;
    const filter: any = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };

    const { users, totalPages, total } = await userService.getUsers(
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10,
      filter,
    );
    return res.status(StatusCodes.OK).json({
      users,
      pagination: {
        currentPage: parseInt(page as string) || 1,
        totalPages,
        totalItems: total,
        itemsPerPage: 10,
      },
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error querying users", error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error querying user", error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    console.log("Update Request - ID:", req.params.id);
    console.log("Update Request - Body:", req.body);

    const updatedUser = await userService.updateUser(req.params.id, req.body);

    console.log("Updated User Result:", updatedUser);

    if (!updatedUser)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });

    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    console.error("Full Error in updateUser:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error updating user",
      error: error.message,
      errorStack: error.stack,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);
    if (!deletedUser)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    return res
      .status(StatusCodes.OK)
      .json({ message: "User successfully deleted", userDetails: deletedUser });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error deleting user", error: error.message });
  }
};
