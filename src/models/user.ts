import "reflect-metadata";
import * as mongoose from "mongoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import {
  pre,
  getModelForClass,
  Prop,
  Ref,
  modelOptions,
} from "@typegoose/typegoose";
import lib from "../utils/lib";
import { RegionModel } from "./region";

import ObjectId = mongoose.Types.ObjectId;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         address:
 *           type: string
 *           description: User's address
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *           description: User's coordinates (latitude and longitude)
 *       required:
 *         - name
 *         - email
 *         - address
 */

/**
 * @swagger
 * /user:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     description: Registers a new user with name, email, address, and/or coordinates.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'João Silva'
 *               email: 'joao.silva@example.com'
 *               address: '123 Example Street'
 *               coordinates: [40.7128, -74.0060]
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
@pre<User>("save", async function (next) {
  if (this.address && !this.coordinates) {
    try {
      const coords = await lib.getCoordinatesFromAddress(this.address);

      if (!coords) {
        return next(new Error("Coordinates not found for the address."));
      }

      const [lat, lng] = coords;
      this.coordinates = [lat, lng];
    } catch (error) {
      return next(new Error(`Failed to get coordinates: ${error.message}`));
    }
  }

  if (this.coordinates && !this.address) {
    try {
      const [lat, lng] = this.coordinates;

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return next(new Error("Invalid coordinates."));
      }

      const address = await lib.getAddressFromCoordinates(this.coordinates);

      if (!address) {
        return next(new Error("Address not found for coordinates."));
      }

      this.address = address;
    } catch (error) {
      return next(new Error(`Failed to get address: ${error.message}`));
    }
  }

  next();
})
@modelOptions({
  schemaOptions: {
    validateBeforeSave: true,
    timestamps: true,
  },
})
export class User extends TimeStamps {
  @Prop({
    required: true,
    default: () => new ObjectId().toString(),
  })
  _id: string;

  @Prop({
    required: true,
    trim: true,
    minlength: [2, "Name is too short"],
    maxlength: [50, "Name is too long"],
  })
  name!: string;

  @Prop({
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [
      {
        validator: function (email: string) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Invalid email",
      },
    ],
  })
  email!: string;

  @Prop({
    required: false,
    validate: {
      validator: function (address: string) {
        return address ? address.length >= 5 : true;
      },
      message: "Address is too short",
    },
  })
  address?: string;

  @Prop({
    required: false,
    type: () => [Number],
  })
  coordinates?: [number, number];

  @Prop({
    ref: "Region",
    type: () => [mongoose.Types.ObjectId],
    default: [],
  })
  regions?: Ref<"Region">[];
}

export const UserModel = getModelForClass(User);

UserModel.schema.pre("validate", function (next) {
  console.log("Running address or coordinates validation...");

  if (!this.address && !this.coordinates) {
    console.log("Validation failed: no address or coordinates provided.");
    return next(
      new Error("You must provide either an address or coordinates."),
    );
  }

  next();
});

UserModel.schema.path("name").validate(function () {
  return !!(this.address || this.coordinates);
}, "You must provide either an address or coordinates.");
