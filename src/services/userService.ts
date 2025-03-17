import { UserModel } from "../models/user";

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
