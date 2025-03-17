import { Request, Response } from "express";
import userService from "../services/userService";
import { StatusCodes } from "http-status-codes";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(StatusCodes.CREATED).json(user);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error creating user", error: error.message });
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
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating user", error: error.message });
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
