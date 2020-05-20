import { ActionSchema } from 'moleculer';
import { IncomingMessage } from 'http';
import { ActionOptions } from '@d0whc3r/moleculer-decorators';
import { UserRole } from './user';

export type DBDialog = 'local' | 'file' | 'mongodb';

export interface DBInfo {
  dialect: DBDialog;
  user: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
  collection: string;
}

export interface RequestMessage extends IncomingMessage {
  $action: ActionSchema;
}

export interface RestOptions extends ActionOptions {
  auth?: boolean;
  roles?: UserRole | UserRole[];
}

// META
export interface ApiGatewayMeta {
  $statusCode?: number;
  $statusMessage?: string;
  $responseType?: string;
  $responseHeaders?: any;
  $location?: string;
}
