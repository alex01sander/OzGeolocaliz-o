// src/routes/userRoutes.ts
import { Router } from "express";
import { createUser } from "../controllers/userController";
import { UserModel } from "../models/user";

const router = Router();

const STATUS = {
  OK: 200,
  CREATED: 201,
  UPDATED: 201,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};

router.post("/users", createUser);

router.get("/users", async (req, res) => {
  const { page, limit } = req.query;

  try {
    console.log(`Fetching users - Page: ${page}, Limit: ${limit}`);

    const [users, total] = await Promise.all([
      UserModel.find().lean(),
      UserModel.countDocuments(),
    ]);

    console.log(`Users found: ${total}`);

    return res.json({
      rows: users,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching user by ID: ${id}`);

    const user = await UserModel.findOne({ _id: id }).lean();

    if (!user) {
      console.warn(`User not found - ID: ${id}`);
      return res.status(STATUS.NOT_FOUND).json({ message: "User not found" });
    }

    console.log(`User found - Name: ${user.name}, Email: ${user.email}`);
    return res.json(user);
  } catch (error) {
    console.error(`Error fetching user - ID: ${id}`, error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching user",
      error: error.message,
    });
  }
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { update } = req.body;

  try {
    console.log(`Updating user - ID: ${id}`, update);

    const user = await UserModel.findOne({ _id: id });

    if (!user) {
      console.warn(`User not found for update - ID: ${id}`);
      return res.status(STATUS.NOT_FOUND).json({ message: "User not found" });
    }

    const oldName = user.name;
    user.name = update.name;

    await user.save();

    console.log(
      `User updated - ID: ${id}, Old Name: ${oldName}, New Name: ${user.name}`,
    );

    return res
      .status(STATUS.UPDATED)
      .json({ message: "User successfully updated" });
  } catch (error) {
    console.error(`Error updating user - ID: ${id}`, error);
    return res
      .status(STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

export default router;
