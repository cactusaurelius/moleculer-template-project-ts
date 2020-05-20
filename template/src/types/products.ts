import { Options } from '@d0whc3r/moleculer-decorators';
import { DbServiceSettings } from 'moleculer-db';
import { IProduct } from '../entities';

export interface ProductServiceSettingsOptions extends DbServiceSettings {
  rest: '/api/products';
  fields: (keyof Required<IProduct>)[];
}

export interface ProductsServiceOptions extends Options {
  name: 'products';
  settings: ProductServiceSettingsOptions;
}

export interface ProductsManipulateValueParams {
  id: string;
  value: number;
}

export interface ProductsRecordParams {
  name: string;
  price: number;
}
