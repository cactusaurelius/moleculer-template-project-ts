import { Options } from '@d0whc3r/moleculer-decorators';
import { DbServiceSettings } from 'moleculer-db';
import { ApiGatewayMeta } from './interfaces';

export interface UserServiceSettingsOptions extends DbServiceSettings {
  rest: '/api/user';
  JWT_SECRET: string;
  fields: (keyof Required<UserJWT>)[];
}

export interface UsersServiceOptions extends Options {
  name: 'user';
  settings: UserServiceSettingsOptions;
}

export enum UserRole {
  SUPERADMIN = 'ROLE_SUPERADMIN',
  ADMIN = 'ROLE_ADMIN',
  APPROVER = 'ROLE_APPROVER',
  MODIFIER = 'ROLE_MODIFIER',
  USER = 'ROLE_USER'
}

export enum UserLang {
  ES = 'es',
  CA = 'ca',
  EN = 'en',
  IT = 'it',
  FR = 'fr'
}

export interface IUserBase {
  login: string;
  firstName: string;
  lastName?: string;
  email: string;
  langKey?: UserLang;
  roles: UserRole[];
  activated?: boolean;
}

export interface UserJWT extends IUserBase {
  _id: string;
}

// PARAMS
export interface UserCreateParams extends IUserBase {
  password: string;
}

export interface UserLoginParams {
  login: string;
  password: string;
}

export interface UserTokenParams {
  token: string;
}

export interface UserRolesParams {
  roles: UserRole[];
}

export interface UserUpdateParams extends Partial<IUserBase> {
  userId: string;
  password?: string;
}

export interface UserGetParams {
  userId: string;
}

export interface UserDeleteParams {
  userId: string;
}

// META
export interface UserAuthMeta extends ApiGatewayMeta {
  user: UserJWT;
}

export interface UserLoginMeta extends ApiGatewayMeta {}
