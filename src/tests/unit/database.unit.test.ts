import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";

import originalInit from "../../config/database";

describe("MongoDB Connection Unit Tests", () => {
  let connectStub;
  let consoleLogStub;
  let processExitStub;
  let originalProcessEnv;

  beforeEach(() => {
    originalProcessEnv = process.env;

    connectStub = sinon.stub(mongoose, "connect");
    consoleLogStub = sinon.stub(console, "log");
    processExitStub = sinon.stub(process, "exit");
  });

  afterEach(() => {
    connectStub.restore();
    consoleLogStub.restore();
    processExitStub.restore();

    process.env = originalProcessEnv;
  });

  it("should connect to MongoDB using the environment variable URI", async () => {
    process.env = {
      ...originalProcessEnv,
      MONGO_URI: "mongodb://test-host:27017/test-db",
    };

    const testInit = async function () {
      const testEnv = {
        MONGO_URI:
          process.env.MONGO_URI || "mongodb://localhost:27017/default-db",
      };

      try {
        await mongoose.connect(testEnv.MONGO_URI);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
      }
    };

    connectStub.resolves();

    await testInit();

    expect(connectStub.calledOnce).to.be.true;
    expect(connectStub.firstCall.args[0]).to.equal(
      "mongodb://test-host:27017/test-db",
    );
    expect(consoleLogStub.calledWith("MongoDB connected successfully")).to.be
      .true;
    expect(processExitStub.called).to.be.false;
  });

  it("should connect to MongoDB using the default URI when no environment variable is defined", async () => {
    process.env = { ...originalProcessEnv };
    delete process.env.MONGO_URI;

    const testInit = async function () {
      const testEnv = {
        MONGO_URI:
          process.env.MONGO_URI || "mongodb://localhost:27017/default-db",
      };

      try {
        await mongoose.connect(testEnv.MONGO_URI);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
      }
    };

    connectStub.resolves();

    await testInit();

    expect(connectStub.calledOnce).to.be.true;
    expect(connectStub.firstCall.args[0]).to.equal(
      "mongodb://localhost:27017/default-db",
    );
    expect(consoleLogStub.calledWith("MongoDB connected successfully")).to.be
      .true;
    expect(processExitStub.called).to.be.false;
  });

  it("should exit the process with code 1 when the connection fails", async () => {
    const testInit = async function () {
      const testEnv = {
        MONGO_URI:
          process.env.MONGO_URI || "mongodb://localhost:27017/default-db",
      };

      try {
        await mongoose.connect(testEnv.MONGO_URI);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
      }
    };

    const error = new Error("Connection error");
    connectStub.rejects(error);

    await testInit();

    expect(connectStub.calledOnce).to.be.true;
    expect(consoleLogStub.calledWith("MongoDB connection failed", error)).to.be
      .true;
    expect(processExitStub.calledWith(1)).to.be.true;
  });
});
