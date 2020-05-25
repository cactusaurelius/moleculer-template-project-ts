import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { Config } from '../common';

export interface IProduct {
  _id: Types.ObjectId | string | null;
  name: string;
  quantity: number;
  price: number;
}

@JsonObject('Product')
export class ProductEntity implements IProduct {
  @JsonProperty('_id', String, true)
  _id = Config.DB_PRODUCT.dialect === 'local' ? Types.ObjectId() : null;

  @JsonProperty('name', String)
  name = '';

  @JsonProperty('quantity', Number)
  quantity = 0;

  @JsonProperty('price', Number)
  price = 0;

  public getMongoEntity() {
    return { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
  }
}
