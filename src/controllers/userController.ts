import { Request, Response } from "express";
import { UserModel } from "../models/user";
import lib from "../utils/lib";
import mongoose from "mongoose";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, address, coordinates } = req.body;
    console.log(`Starting user creation - Name: ${name}, Email: ${email}`);

    if (address && coordinates) {
      console.warn("Invalid user creation attempt");
      return res.status(400).json({
        message: "You must provide either address or coordinates, not both.",
      });
    }

    if (!address && !coordinates) {
      console.warn("User creation attempt without address or coordinates");
      return res
        .status(400)
        .json({ message: "Provide address or coordinates." });
    }

    const userData: any = { name, email };

    if (address) {
      userData.address = address;
      const coords = await lib.getCoordinatesFromAddress(address);

      console.log("Coordinates returned for address:", coords);

      if (!coords || coords.length !== 2) {
        throw new Error("Coordinates not found for the address.");
      }

      userData.coordinates = coords;
    }

    if (coordinates) {
      userData.coordinates = coordinates;
      const addr = await lib.getAddressFromCoordinates(coordinates);

      console.log("Address returned for coordinates:", addr);

      if (!addr) {
        throw new Error("Address not found for coordinates.");
      }

      userData.address = addr;
    }

    console.log("User data before saving:", userData);

    try {
      const user = new UserModel(userData);
      await user.save();
      console.log(
        `User created successfully - ID: ${user._id}, Email: ${user.email}`,
      );
      return res.status(201).json(user);
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      return res.status(500).json({
        message: "Error saving user",
        error: saveError.message,
      });
    }
  } catch (error) {
    console.error("Unexpected error creating user:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    console.log("Starting query for all users");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: "i" };
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(`Query finished - ${users.length} users found out of ${total}`);

    return res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error querying users:", error);
    return res.status(500).json({
      message: "Error querying users",
      error: error.message,
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Starting user query - ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid user ID: ${id}`);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserModel.findById(id);

    if (!user) {
      console.warn(`User not found - ID: ${id}`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User found - ID: ${id}, Email: ${user.email}`);
    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error querying user by ID: ${error}`);
    return res.status(500).json({
      message: "Error querying user",
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, address, coordinates } = req.body;

    console.log(`Starting user update - ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid user ID for update: ${id}`);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      console.warn(`User not found for update - ID: ${id}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (address && coordinates) {
      return res.status(400).json({
        message: "You must provide either address or coordinates, not both.",
      });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (address) {
      updateData.address = address;
      const coords = await lib.getCoordinatesFromAddress(address);

      if (!coords || coords.length !== 2) {
        throw new Error("Coordinates not found for the address.");
      }

      updateData.coordinates = coords;
    }

    if (coordinates) {
      updateData.coordinates = coordinates;
      const addr = await lib.getAddressFromCoordinates(coordinates);

      if (!addr) {
        throw new Error("Address not found for coordinates.");
      }

      updateData.address = addr;
    }

    console.log("Data for update:", updateData);

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    console.log(`User updated successfully - ID: ${id}`);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(`Error updating user: ${error}`);
    return res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Starting user deletion - ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid user ID for deletion: ${id}`);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      console.warn(`User not found for deletion - ID: ${id}`);
      return res.status(404).json({ message: "User not found" });
    }

    await UserModel.findByIdAndDelete(id);

    console.log(`User successfully deleted - ID: ${id}, Email: ${user.email}`);
    return res.status(200).json({
      message: "User successfully deleted",
      userDetails: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(`Error deleting user: ${error}`);
    return res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};
