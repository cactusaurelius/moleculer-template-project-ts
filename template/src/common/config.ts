import os from 'os';
import { DBDialog, DBInfo } from '../types';

function isTrue(text?: string | number) {
  return [1, true, 'true', 'yes'].includes(text || '');
}

function isFalse(text?: string | number) {
  return [0, false, 'false', 'no'].includes(text || '');
}

function getValue(text?: string, defaultValud?: string | boolean) {
  const vtrue = isTrue(text);
  const vfalse = isFalse(text);
  const val = text || defaultValud;
  if (vtrue) {
    return true;
  } else if (vfalse) {
    return false;
  } else {
    return val;
  }
}

const HOST_NAME = os.hostname().toLowerCase();

function getDbInfo(where: string, what: string, defaultValue: string) {
  const value = process.env[`DB_${where}_${what}`];
  const generic = process.env[`DB_GENERIC_${what}`];
  return value || generic || defaultValue;
}

export class Config {
  public static NODE_ENV = process.env.NODE_ENV || 'production';
  public static IS_TEST = Config.NODE_ENV === 'test';
  public static HOST = process.env.HOST || '0.0.0.0';
  public static PORT = +(process.env.PORT || 80);
  public static REQUEST_TIMEOUT = +(process.env.REQUEST_TIMEOUT || 10000);
  public static NAMESPACE = process.env.NAMESPACE || undefined;
  public static NODEID = `${process.env.NODEID ? process.env.NODEID + '-' : ''}${HOST_NAME}-${Config.NODE_ENV}`;
  public static TRANSPORTER = process.env.TRANSPORTER || undefined;
  public static CACHER = getValue(process.env.CACHER, undefined);
  public static STRATEGY = process.env.STRATEGY || 'RoundRobin'; // "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"{{#userService}}
  public static MAPPING_POLICY = process.env.MAPPING_POLICY || 'restrict';
  public static JWT_SECRET = process.env.JWT_SECRET || 'dummy-secret';
  public static DB_USER: DBInfo = {
    dialect: getDbInfo('USER', 'DIALECT', 'local') as DBDialog,
    user: getDbInfo('USER', 'USER', ''),
    password: getDbInfo('USER', 'PASSWORD', ''),
    host: getDbInfo('USER', 'HOST', ''),
    port: +getDbInfo('USER', 'PORT', '0'),
    dbname: getDbInfo('USER', 'DBNAME', ''),
    collection: getDbInfo('USER', 'COLLECTION', '')
  };{{/userService}}{{#dbService}}
  public static DB_PRODUCT: DBInfo = {
    dialect: getDbInfo('PRODUCT', 'DIALECT', 'local') as DBDialog,
    user: getDbInfo('PRODUCT', 'PRODUCT', ''),
    password: getDbInfo('PRODUCT', 'PASSWORD', ''),
    host: getDbInfo('PRODUCT', 'HOST', ''),
    port: +getDbInfo('PRODUCT', 'PORT', '0'),
    dbname: getDbInfo('PRODUCT', 'DBNAME', ''),
    collection: getDbInfo('PRODUCT', 'COLLECTION', '')
  };{{/dbService}}
}
