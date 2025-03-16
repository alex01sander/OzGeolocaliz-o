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

import ObjectId = mongoose.Types.ObjectId;
import { RegionModel } from "./region";

@pre<User>("save", async function (next) {
  if (this.address && !this.coordinates) {
    try {
      const [lat, lng] = await lib.getCoordinatesFromAddress(this.address);
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

      this.address = await lib.getAddressFromCoordinates(this.coordinates);
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
