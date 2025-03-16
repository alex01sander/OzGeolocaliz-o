import "reflect-metadata";
import * as mongoose from "mongoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import {
  pre,
  getModelForClass,
  Prop,
  Ref,
  modelOptions,
  index,
} from "@typegoose/typegoose";

const { ObjectId } = mongoose.Types;
import { UserModel } from "./user";

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new ObjectId() })
  _id: mongoose.Types.ObjectId;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Region:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the region
 *         user:
 *           type: string
 *           description: ID of the user associated with the region
 *         location:
 *           type: object
 *           description: GeoJSON Polygon representing the location of the region
 *           properties:
 *             type:
 *               type: string
 *               description: The type of the location (Polygon)
 *             coordinates:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: number
 *               description: Array of coordinates defining the region's boundaries
 *       required:
 *         - name
 *         - user
 *         - location
 */

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Create a new region
 *     description: Creates a new region with name, user ID, and location (GeoJSON polygon).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Region'
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: 'North Region'
 *               user: '60d5f847ed3e1f1f1c0b13a9'
 *               location:
 *                 type: "Polygon"
 *                 coordinates: [[[40.7128, -74.0060], [40.7138, -74.0050], [40.7118, -74.0050], [40.7128, -74.0060]]]
 *               createdAt: '2025-03-16T12:00:00Z'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
@pre<Region>("save", async function (next) {
  const region = this as Omit<any, keyof Region> & Region;

  if (region.location && region.location.coordinates) {
    region.location.coordinates = Region.closePolygon(
      region.location.coordinates,
    );
  }

  if (region.isNew) {
    const user = await UserModel.findOne({ _id: region.user });
    if (user) {
      if (!user.regions.includes(region._id)) {
        user.regions.push(region._id);
      }

      user.regions = Array.from(new Set(user.regions));
      await user.save({ session: region.$session() });
    }
  }

  next();
})
@modelOptions({ schemaOptions: { validateBeforeSave: true } })
@index({ location: "2dsphere" })
export class Region extends Base {
  @Prop({ required: true })
  name!: string;

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
        return (
          v &&
          v.type === "Polygon" &&
          Array.isArray(v.coordinates) &&
          Array.isArray(v.coordinates[0]) &&
          v.coordinates[0].length >= 4 &&
          Region.areCoordinatesValid(v.coordinates[0])
        );
      },
      message:
        "Location must be a valid GeoJSON Polygon with at least 4 points.",
    },
  })
  location: {
    type: "Polygon";
    coordinates: [number, number][][];
  };

  static areCoordinatesValid(coordinates: [number, number][]): boolean {
    return coordinates.every(
      ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
    );
  }

  static closePolygon(coordinates: [number, number][][]): [number, number][][] {
    if (coordinates.length === 0 || coordinates[0].length === 0) {
      return coordinates;
    }

    const ring = coordinates[0];
    const firstPoint = ring[0];
    const lastPoint = ring[ring.length - 1];

    if (
      !lastPoint ||
      firstPoint[0] !== lastPoint[0] ||
      firstPoint[1] !== lastPoint[1]
    ) {
      ring.push([...firstPoint]);
    }

    return coordinates;
  }
}

export const RegionModel = getModelForClass(Region);

RegionModel.createIndexes().then(() => {
  console.log("Indexes created for RegionModel");
});
