import { Request, Response } from "express";
import userService from "../services/userService";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/user";
import lib from "../utils/lib";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique user ID
 *         name:
 *           type: string
 *           description: Name of the user
 *         email:
 *           type: string
 *           description: Email of the user
 *         address:
 *           type: string
 *           description: Address of the user
 *         coordinates:
 *           type: array
 *           description: Geographic coordinates [longitude, latitude]
 *           items:
 *             type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last record update date
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         name: "João Silva"
 *         email: "joao@example.com"
 *         address: "Av. Paulista, 1000, São Paulo, SP"
 *         coordinates: [-46.633308, -23.550520]
 *         createdAt: "2023-05-12T15:30:45.123Z"
 *         updatedAt: "2023-05-12T15:30:45.123Z"
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user based on the provided data. It is required to provide either an address or coordinates.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user
 *               address:
 *                 type: string
 *                 description: Address of the user (optional if coordinates are provided)
 *               coordinates:
 *                 type: array
 *                 description: Geographic coordinates [longitude, latitude] (optional if address is provided)
 *                 items:
 *                   type: number
 *                 example: [-46.633308, -23.550520]
 *             example:
 *               name: "João Silva"
 *               email: "joao@example.com"
 *               address: "Av. Paulista, 1000, São Paulo, SP"
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid data - Address or coordinates must be provided
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users
 *     description: Returns a paginated list of users with filter options by name and email
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial search, case insensitive)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (partial search, case insensitive)
 *     responses:
 *       200:
 *         description: List of users successfully returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 47
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: Internal error while querying users
 */

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

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns the details of a specific user based on the provided ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User successfully found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error while querying user
 */

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

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     description: Updates the data of an existing user based on the provided ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user
 *               address:
 *                 type: string
 *                 description: Address of the user
 *               coordinates:
 *                 type: array
 *                 description: Geographic coordinates [longitude, latitude]
 *                 items:
 *                   type: number
 *             example:
 *               name: "João Silva Updated"
 *               email: "joao.novo@example.com"
 *     responses:
 *       200:
 *         description: User successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error while updating user
 */

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

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Removes a user from the system based on the provided ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to be deleted
 *     responses:
 *       200:
 *         description: User successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User successfully deleted"
 *                 userDetails:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error while deleting user
 */

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
