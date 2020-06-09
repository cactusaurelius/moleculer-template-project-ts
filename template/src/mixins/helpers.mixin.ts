import { DbAdapter } from 'moleculer-db';
import path from 'path';
import { Config } from '../common';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import parseSync from 'csv-parse/lib/sync';
import { JsonConvert } from 'json2typescript';
import { DBInfo } from '../types';
import { CastingContext, Options } from 'csv-parse';

function getValue(value: string, context: CastingContext): unknown {
  let result: any = value;
  if (context.lines > 1) {
    if (!value) {
      return undefined;
    }
    if (value.toLowerCase() === 'true') {
      result = true;
    } else if (value.toLowerCase() === 'false') {
      result = false;
    } else if (value.includes('|')) {
      result = value.split('|').filter(Boolean);
    } else if (context.column === 'password') {
      result = bcrypt.hashSync(value, 10);
    } else if (Number(value)) {
      result = Number(value);
    } else if (value.startsWith('{') && value.endsWith('}')) {
      result = JSON.parse(value.replace(/'/g, '"'));
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result;
}

export function dbSeed(dbInfo: DBInfo, classReference: new () => any) {
  return async function (adapter: DbAdapter) {
    const csvFile = path.resolve(__dirname, '../../database', Config.NODE_ENV, `${dbInfo.collection}.csv`);
    if (fs.existsSync(csvFile)) {
      const content = fs.readFileSync(csvFile, 'utf8');
      const cast = (value: string, context: CastingContext) => getValue(value, context);
      const options: Options = {
        delimiter: ',',
        trim: true,
        cast,
        comment: '#',
        auto_parse: true,
        skip_empty_lines: true,
        columns: true
      };
      for (const row of parseSync(content, options)) {
        const item: any = new JsonConvert().deserializeObject(row, classReference);
        await adapter.insert(item);
      }
    }
  };
}
