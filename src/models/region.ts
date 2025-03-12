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

import ObjectId = mongoose.Types.ObjectId;
import { UserModel } from "./user";

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new ObjectId().toString() })
  _id: string;
}

@pre<Region>("save", async function (next) {
  const region = this as Omit<any, keyof Region> & Region;

  if (!region._id) {
    region._id = new ObjectId().toString();
  }

  if (region.isNew) {
    const user = await UserModel.findOne({ _id: region.user });
    if (user) {
      user.regions.push(region._id);
      await user.save({ session: region.$session() });
    }
  }

  next(region.validateSync());
})
@modelOptions({ schemaOptions: { validateBeforeSave: false } })
export class Region extends Base {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, type: () => [Number] })
  coordinates!: [number, number][];

  @Prop({ ref: () => UserModel, required: true, type: () => String })
  user: Ref<typeof UserModel>;
}

export const RegionModel = getModelForClass(Region);
