import { DbBaseMixin } from './db-base.mixin';
import { productMongoModel } from '../models';
import { Config } from '../common';
import { dbSeed } from './helpers.mixin';
import { ProductEntity } from '../entities';

const dbInfo = Config.DB_PRODUCT;

const dbBaseMixin = new DbBaseMixin({
  dbInfo,
  name: 'dbProductMixin',
  collection: dbInfo.collection,
  model: productMongoModel(dbInfo.collection)
});

export const dbProductMixin = dbBaseMixin.getMixin(dbSeed(dbInfo, ProductEntity));
export const eventsProductMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
