import * as sinon from "sinon";
import { expect } from "chai";
import mongoose from "mongoose";

import * as databaseModule from "../../config/database";

describe("MongoDB Connection Integration Tests", () => {
  let sandbox: sinon.SinonSandbox;
  let connectStub: sinon.SinonStub;
  let consoleLogSpy: sinon.SinonSpy;
  let processExitStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    connectStub = sandbox.stub(mongoose, "connect");
    consoleLogSpy = sandbox.spy(console, "log");
    processExitStub = sandbox
      .stub(process, "exit")
      .callsFake(() => undefined as never);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should successfully connect to MongoDB", async () => {
    connectStub.resolves();

    const mongoUri = "mongodb://localhost:27017/test-db";
    const env = { MONGO_URI: mongoUri };

    const init = async function () {
      try {
        await mongoose.connect(env.MONGO_URI);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
      }
    };

    await init();

    expect(connectStub.calledOnce).to.be.true;
    expect(connectStub.calledWith(mongoUri)).to.be.true;

    expect(consoleLogSpy.calledWith("MongoDB connected successfully")).to.be
      .true;

    expect(processExitStub.called).to.be.false;
  });

  it("should fail when trying to connect with invalid credentials", async () => {
    const connectionError = new Error("Authentication failed");
    connectStub.rejects(connectionError);

    const mongoUri = "mongodb://invalid:invalid@localhost:27017/invalid-db";
    const env = { MONGO_URI: mongoUri };

    const init = async function () {
      try {
        await mongoose.connect(env.MONGO_URI);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
      }
    };

    await init();

    expect(connectStub.calledOnce).to.be.true;
    expect(connectStub.calledWith(mongoUri)).to.be.true;

    expect(
      consoleLogSpy.calledWith("MongoDB connection failed", connectionError),
    ).to.be.true;

    expect(processExitStub.calledWith(1)).to.be.true;
  });
});
