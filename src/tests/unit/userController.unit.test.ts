import * as sinon from "sinon";
import { expect } from "chai";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as userController from "../../controllers/userController";
import userService from "../../services/userService";

describe("User Controller - Unit Tests", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  const sampleUser = {
    _id: "60d0fe4f5311236168a109ca",
    name: "John Doe",
    email: "john.doe@example.com",
  } as any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub(),
    };
    req = {};
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        address: "123 Test Street",

        coordinates: [0, 0],
      };

      const createUserStub = sandbox
        .stub(userService, "createUser")
        .callsFake(async (data) => {
          return {
            ...data,
            _id: "someGeneratedId",
            createdAt: new Date(),
          };
        });

      await userController.createUser(
        { body: userData } as Request,
        res as Response,
      );

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.CREATED,
      );
      expect((res.json as sinon.SinonStub).firstCall.args[0]).to.include({
        name: userData.name,
        email: userData.email,
        address: userData.address,
      });

      sinon.assert.calledOnce(createUserStub);
    });
  });

  describe("getUsers", () => {
    it("should get users with pagination", async () => {
      req.query = { page: "1", limit: "10" };
      sandbox.stub(userService, "getUsers").resolves({
        users: [sampleUser],
        totalPages: 1,
        total: 1,
      });

      await userController.getUsers(req as Request, res as Response);

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.OK,
      );
      expect(
        (res.json as sinon.SinonStub).firstCall.args[0].users,
      ).to.deep.equal([sampleUser]);
    });
  });

  describe("getUserById", () => {
    it("should get a user by ID", async () => {
      req.params = { id: sampleUser._id };
      sandbox.stub(userService, "getUserById").resolves(sampleUser);

      await userController.getUserById(req as Request, res as Response);

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.OK,
      );
      expect((res.json as sinon.SinonStub).firstCall.args[0]).to.equal(
        sampleUser,
      );
    });

    it("should return 404 when user not found", async () => {
      req.params = { id: "nonexistent" };
      sandbox.stub(userService, "getUserById").resolves(null);

      await userController.getUserById(req as Request, res as Response);

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.NOT_FOUND,
      );
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      req.params = { id: sampleUser._id };
      req.body = { name: "Updated Name" };
      sandbox.stub(userService, "updateUser").resolves(sampleUser);

      await userController.updateUser(req as Request, res as Response);

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.OK,
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      req.params = { id: sampleUser._id };
      sandbox.stub(userService, "deleteUser").resolves(sampleUser);

      await userController.deleteUser(req as Request, res as Response);

      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(
        StatusCodes.OK,
      );
    });
  });
});
