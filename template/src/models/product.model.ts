import { models, model, Schema, SchemaType, SchemaTypeOpts, Types } from 'mongoose';
import { IProduct } from '../types';

type definitionType = () => Record<keyof Required<IProduct>, SchemaTypeOpts<any> | Schema | SchemaType>;

const definition: definitionType = () => ({
  _id: Types.ObjectId,
  name: {
    type: String,
    max: 50,
    min: 3,
    unique: true,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true
  }
});

export const productMongoModel = (collection: string) => {
  const schema = new Schema<IProduct>(definition(), { autoIndex: true });
  return models[collection] || model(collection, schema);
};
