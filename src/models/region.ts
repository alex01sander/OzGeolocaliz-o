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

  @Prop({
    required: true,
    type: () => [[Number]],
  })
  coordinates!: [number, number][][];

  @Prop({ ref: () => UserModel, required: true, type: () => String })
  user: Ref<typeof UserModel>;

  @Prop({ required: true })
  location: { type: "Polygon"; coordinates: [number, number][][] };
}

export const RegionModel = getModelForClass(Region);

RegionModel.createIndexes().then(() => {
  console.log("Indexes created for RegionModel");
});

export async function findRegionsByPoint(
  lat: number,
  lng: number,
  userId: string,
) {
  return RegionModel.find({
    location: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    },
    user: userId,
  });
}

export async function findRegionsWithinDistance(
  lat: number,
  lng: number,
  distance: number,
  userId: string,
) {
  return RegionModel.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: distance,
      },
    },
    user: userId,
  });
}
