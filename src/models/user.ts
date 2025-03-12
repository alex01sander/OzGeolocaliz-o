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
import { Region } from "./region";

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new ObjectId().toString() })
  _id: string;
}

@pre<User>("save", async function (next) {
  const user = this as Omit<any, keyof User> & User;

  if (user.isModified("coordinates")) {
    user.address = await lib.getAddressFromCoordinates(user.coordinates);
  } else if (user.isModified("address")) {
    const { lat, lng } = await lib.getCoordinatesFromAddress(user.address);
    user.coordinates = [lng, lat];
  }

  next();
})
@modelOptions({ schemaOptions: { validateBeforeSave: false } })
export class User extends Base {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true, type: () => [Number] })
  coordinates!: [number, number];

  @Prop({ required: true, default: [], ref: () => Region, type: () => String })
  regions: Ref<Region>[];
}

export const UserModel = getModelForClass(User);
