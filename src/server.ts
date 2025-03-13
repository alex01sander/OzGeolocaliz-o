import express from "express";
import { createUser } from "./controllers/userController";
import { UserModel } from "./models/user";

const server = express();
const router = express.Router();

server.use(express.json());

server.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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
    console.log(`Buscando usuários - Página: ${page}, Limite: ${limit}`);

    const [users, total] = await Promise.all([
      UserModel.find().lean(),
      UserModel.countDocuments(),
    ]);

    console.log(`Usuários encontrados: ${total}`);

    return res.json({
      rows: users,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Erro ao buscar usuários",
      error: error.message,
    });
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Buscando usuário pelo ID: ${id}`);

    const user = await UserModel.findOne({ _id: id }).lean();

    if (!user) {
      console.warn(`Usuário não encontrado - ID: ${id}`);
      return res
        .status(STATUS.NOT_FOUND)
        .json({ message: "Usuário não encontrado" });
    }

    console.log(
      `Usuário encontrado - Nome: ${user.name}, Email: ${user.email}`,
    );
    return res.json(user);
  } catch (error) {
    console.error(`Erro ao buscar usuário - ID: ${id}`, error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Erro ao buscar usuário",
      error: error.message,
    });
  }
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { update } = req.body;

  try {
    console.log(`Atualizando usuário - ID: ${id}`, update);

    const user = await UserModel.findOne({ _id: id });

    if (!user) {
      console.warn(`Usuário não encontrado para atualização - ID: ${id}`);
      return res
        .status(STATUS.NOT_FOUND)
        .json({ message: "Usuário não encontrado" });
    }

    const oldName = user.name;
    user.name = update.name;

    await user.save();

    console.log(
      `Usuário atualizado - ID: ${id}, Nome antigo: ${oldName}, Nome novo: ${user.name}`,
    );

    return res
      .status(STATUS.UPDATED)
      .json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error(`Erro ao atualizar usuário - ID: ${id}`, error);
    return res
      .status(STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

server.use(router);

export default server;
