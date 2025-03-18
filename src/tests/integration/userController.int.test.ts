import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { StatusCodes } from "http-status-codes";
import * as userController from "../../controllers/userController";
import userService from "../../services/userService";

const app = express();
app.use(bodyParser.json());

app.post("/api/users", userController.createUser);
app.get("/api/users", userController.getUsers);
app.get("/api/users/:id", userController.getUserById);
app.put("/api/users/:id", userController.updateUser);
app.delete("/api/users/:id", userController.deleteUser);

const request = supertest(app);

describe("User Controller - Integration Tests", () => {
  let sandbox: sinon.SinonSandbox;

  const sampleUser = {
    _id: "60d0fe4f5311236168a109ca",
    name: "John Doe",
    email: "john.doe@example.com",
  } as any;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("POST /api/users", () => {
    it("should create a user", async () => {
      const userData = { name: "John Doe", email: "john@example.com" };
      sandbox.stub(userService, "createUser").resolves(sampleUser);

      const response = await request.post("/api/users").send(userData);

      expect(response.status).to.equal(StatusCodes.CREATED);
      expect(response.body).to.deep.equal(sampleUser);
    });
  });

  describe("GET /api/users", () => {
    it("should get users with pagination", async () => {
      sandbox.stub(userService, "getUsers").resolves({
        users: [sampleUser],
        totalPages: 1,
        total: 1,
      });

      const response = await request.get("/api/users?page=1&limit=10");

      expect(response.status).to.equal(StatusCodes.OK);
      expect(response.body.users).to.deep.equal([sampleUser]);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get a user by ID", async () => {
      sandbox.stub(userService, "getUserById").resolves(sampleUser);

      const response = await request.get(`/api/users/${sampleUser._id}`);

      expect(response.status).to.equal(StatusCodes.OK);
      expect(response.body).to.deep.equal(sampleUser);
    });

    it("should return 404 when user not found", async () => {
      sandbox.stub(userService, "getUserById").resolves(null);

      const response = await request.get("/api/users/nonexistent");

      expect(response.status).to.equal(StatusCodes.NOT_FOUND);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update a user", async () => {
      const updateData = { name: "Updated Name" };
      sandbox.stub(userService, "updateUser").resolves(sampleUser);

      const response = await request
        .put(`/api/users/${sampleUser._id}`)
        .send(updateData);

      expect(response.status).to.equal(StatusCodes.OK);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete a user", async () => {
      sandbox.stub(userService, "deleteUser").resolves(sampleUser);

      const response = await request.delete(`/api/users/${sampleUser._id}`);

      expect(response.status).to.equal(StatusCodes.OK);
    });
  });
});
