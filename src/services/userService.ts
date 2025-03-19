import { UserModel } from "../models/user";

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
 *           format: email
 *           description: Email address of the user
 *         address:
 *           type: string
 *           description: Address of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date of the user
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         name: "John Doe"
 *         email: "john.doe@example.com"
 *         address: "123 Main St, Springfield"
 *         createdAt: "2023-05-12T15:30:45.123Z"
 *         updatedAt: "2023-05-12T15:30:45.123Z"
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user in the system
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - address
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
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid data provided
 *
 *   get:
 *     summary: Get users
 *     description: Returns a paginated list of users with optional filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of users per page
 *       - in: query
 *         name: filter
 *         schema:
 *           type: object
 *         description: Optional filters to apply to the users list (e.g., by name or email)
 *     responses:
 *       200:
 *         description: A paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages available
 *                 total:
 *                   type: integer
 *                   description: Total number of users
 *       400:
 *         description: Invalid pagination or filter parameters
 *
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *
 *   patch:
 *     summary: Update user
 *     description: Updates an existing user's details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The new email of the user
 *               address:
 *                 type: string
 *                 description: The new address of the user
 *     responses:
 *       200:
 *         description: User successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid data provided for update
 *       404:
 *         description: User not found
 *
 *   delete:
 *     summary: Delete user
 *     description: Deletes a user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
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
 *       404:
 *         description: User not found
 */

class UserService {
  async createUser(userData: any) {
    const user = new UserModel(userData);
    await user.save();
    return user;
  }

  async getUsers(page: number, limit: number, filter: any) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { users, totalPages, total };
  }

  async getUserById(id: string) {
    const user = await UserModel.findById(id);
    return user;
  }

  async updateUser(id: string, userData: any) {
    const updatedUser = await UserModel.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true,
    });
    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    return user;
  }
}

export default new UserService();
