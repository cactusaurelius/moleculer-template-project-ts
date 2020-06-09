import os from 'os';
import { DBDialog, DBInfo } from '../types';
import { LogLevels } from 'moleculer';

function isTrue(text?: string | number) {
  return [1, true, '1', 'true', 'yes'].includes(text || '');
}

function isFalse(text?: string | number) {
  return [0, false, '0', 'false', 'no'].includes(text || '');
}

function getValue(text?: string, defaultValud?: string | boolean) {
  const vtrue = isTrue(text);
  const vfalse = isFalse(text);
  const val = text || defaultValud;
  if (vtrue) {
    return true;
  } else if (vfalse) {
    return false;
  }
  return val;
}

const HOST_NAME = os.hostname().toLowerCase();

function getDbInfo(where: string, what: string, defaultValue: string) {
  const value = process.env[`DB_${where}_${what}`];
  const generic = process.env[`DB_GENERIC_${what}`];
  return value || generic || defaultValue;
}

function genericDbInfo(where: string): DBInfo {
  return {
    dialect: getDbInfo(where, 'DIALECT', 'local') as DBDialog,
    user: getDbInfo(where, 'USER', ''),
    password: getDbInfo(where, 'PASSWORD', ''),
    host: getDbInfo(where, 'HOST', ''),
    port: +getDbInfo(where, 'PORT', '0'),
    dbname: getDbInfo(where, 'DBNAME', ''),
    collection: getDbInfo(where, 'COLLECTION', where.toLowerCase())
  };
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
  public static SERIALIZER = process.env.SERIALIZER || 'JSON'; // "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift"
  public static MAPPING_POLICY = process.env.MAPPING_POLICY || 'restrict';
  public static LOGLEVEL = (process.env.LOGLEVEL || 'info') as LogLevels;
  public static TRACING_ENABLED = isTrue(process.env.TRACING_ENABLED || '1');
  public static TRACING_TYPE = process.env.TRACING_TYPE || 'Console';
  public static TRACING_ZIPKIN_URL = process.env.TRACING_ZIPKIN_URL || 'http://zipkin:9411';
  public static METRICS_ENABLED = isTrue(process.env.METRICS_ENABLED || '1');
  public static METRICS_TYPE = process.env.METRICS_TYPE || 'Prometheus';
  public static METRICS_PORT = +(process.env.METRICS_PORT || 3030);
  public static METRICS_PATH = process.env.METRICS_PATH || '/metrics';
  public static RATE_LIMIT = +(process.env.RATE_LIMIT || 10);
  public static RATE_LIMIT_WINDOW = +(process.env.RATE_LIMIT_WINDOW || 10000);
  public static STRATEGY = process.env.STRATEGY || 'RoundRobin'; // "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"{{#userService}}
  public static JWT_SECRET = process.env.JWT_SECRET || 'dummy-secret';
  public static DB_USER = genericDbInfo('USER');{{/userService}}{{#dbService}}
  public static DB_PRODUCT = genericDbInfo('PRODUCT');{{/dbService}}
}
