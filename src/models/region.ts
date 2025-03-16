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

const { ObjectId } = mongoose.Types;
import { UserModel } from "./user";

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new ObjectId() })
  _id: mongoose.Types.ObjectId;
}

@pre<Region>("save", async function (next) {
  const region = this as Omit<any, keyof Region> & Region;

  if (region.isNew) {
    const user = await UserModel.findOne({ _id: region.user });
    if (user) {
      user.regions.push(region._id);
      await user.save({ session: region.$session() });
    }
  }

  next();
})
@modelOptions({ schemaOptions: { validateBeforeSave: true } })
export class Region extends Base {
  @Prop({ required: true })
  name!: string;

  @Prop({
    required: true,
    type: () => [[Number]],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "Coordinates must be a non-empty array of numbers.",
    },
  })
  coordinates!: [number, number][][];

  @Prop({
    ref: "User",
    required: true,
    type: () => mongoose.Types.ObjectId,
  })
  user: Ref<"User">;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function (v) {
        return v && v.type === "Polygon" && Array.isArray(v.coordinates);
      },
      message: "Location must be a valid GeoJSON Polygon.",
    },
  })
  location: { type: "Polygon"; coordinates: [number, number][][] };
}

export const RegionModel = getModelForClass(Region);

RegionModel.createIndexes().then(() => {
  console.log("Indexes created for RegionModel");
});
