import { DbBaseMixin } from './db-base.mixin';
import { userMongoModel } from '../models';
import { Config } from '../common';
import { dbSeed } from './helpers.mixin';
import { UserEntity } from '../entities';

const dbInfo = Config.DB_USER;

const dbBaseMixin = new DbBaseMixin({
  dbInfo,
  name: 'dbUserMixin',
  collection: dbInfo.collection,
  model: userMongoModel(dbInfo.collection)
});

export const dbUserMixin = dbBaseMixin.getMixin(dbSeed(dbInfo, UserEntity));
export const eventsUserMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
