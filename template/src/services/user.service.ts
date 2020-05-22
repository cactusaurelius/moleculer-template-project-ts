import moleculer, { ActionParams, Context } from 'moleculer';
import { dbUserMixin, eventsUserMixin } from '../mixins';
import { Config } from '../common';
import { Action, Delete, Get, Method, Post, Put, Service } from '@d0whc3r/moleculer-decorators';
import {
  IUser,
  MoleculerDBService,
  RestOptions,
  UserAuthMeta,
  UserCreateParams,
  UserDeleteParams,
  UserGetParams,
  UserJWT,
  UserLoginMeta,
  UserLoginParams,
  UserRole,
  UserRolesParams,
  UserServiceSettingsOptions,
  UsersServiceOptions,
  UserTokenParams,
  UserUpdateParams
} from '../types';
import bcrypt from 'bcryptjs';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { JsonConvert } from 'json2typescript';
import { UserEntity } from '../entities';
import { constants } from 'http2';
import { DbContextParameters } from 'moleculer-db';

const validateUserBase: ActionParams = {
  login: 'string',
  email: 'email',
  firstName: 'string',
  lastName: { type: 'string', optional: true },
  activated: { type: 'boolean', optional: true },
  roles: { type: 'array', items: 'string' },
  langKey: { type: 'string', min: 2, max: 2, optional: true }
};

const validateUserBaseOptional: ActionParams = {
  login: { type: 'string', optional: true },
  email: { type: 'email', optional: true },
  firstName: { type: 'string', optional: true },
  lastName: { type: 'string', optional: true },
  activated: { type: 'boolean', optional: true },
  roles: { type: 'array', items: 'string', optional: true },
  langKey: { type: 'string', min: 2, max: 2, optional: true }
};

function encryptPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

@Service<UsersServiceOptions>({
  name: 'user',
  mixins: [dbUserMixin, eventsUserMixin],
  settings: {
    idField: '_id',
    pageSize: 10,
    rest: '/user',
    JWT_SECRET: Config.JWT_SECRET,
    fields: ['_id', 'login', 'firstName', 'lastName', 'email', 'langKey', 'roles', 'activated']
  }
})
export default class UserService extends MoleculerDBService<UserServiceSettingsOptions, IUser> {
  @Action({
    name: 'resolveToken',
    cache: {
      keys: ['token'],
      ttl: 30 * 60 // 0,5 hour
    },
    params: {
      token: 'string'
    }
  })
  async resolveToken(ctx: Context<UserTokenParams, {}>) {
    try {
      const result = await new Promise<IUser | undefined>((resolve, reject) => {
        jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err: VerifyErrors | null, decoded?: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });
      if (result && result._id) {
        const user = await this.getById(result._id.toString());
        return this.transformDocuments<UserJWT>(ctx, {}, user);
      }
    } catch (e) {
      this.logger.error('Error resolving token', ctx.params.token, e);
    }
    return undefined;
  }

  @Action({
    name: 'validateRole',
    cache: false,
    params: {
      roles: { type: 'array', items: 'string', enum: Object.values(UserRole) }
    }
  })
  async validateRole(ctx: Context<UserRolesParams, UserAuthMeta>) {
    const roles = ctx.params.roles;
    const userRoles = ctx.meta.user.roles;
    return !roles || !roles.length || roles.some((r) => userRoles.includes(r));
  }

  // @Post('/login', {
  //   name: 'login',
  //   params: {
  //     login: { type: 'string' },
  //     password: { type: 'string', min: 1 }
  //   }
  // })
  @Action({
    name: 'login',
    params: {
      login: { type: 'string' },
      password: { type: 'string', min: 1 }
    }
  })
  async loginUser(ctx: Context<UserLoginParams, UserLoginMeta>) {
    const { login, password } = ctx.params;

    const result = await this.adapter.findOne<IUser>({ login });
    if (!result) {
      throw new moleculer.Errors.MoleculerClientError('User not valid or wrong password!', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY, '', [
        { field: 'login/password', message: 'not found' }
      ]);
    } else if (!result.activated) {
      throw new moleculer.Errors.MoleculerClientError('User not active!', constants.HTTP_STATUS_FORBIDDEN, '', [
        { field: 'disabled', message: 'user disabled' }
      ]);
    }

    const valid = await bcrypt.compare(password, result.password);
    if (!valid) {
      throw new moleculer.Errors.MoleculerClientError('User not valid or wrong password!', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY, '', [
        { field: 'login/password', message: 'not found' }
      ]);
    }

    const user: UserJWT = await this.transformDocuments(ctx, {}, result);
    const token = this.generateJWT(user);
    // eslint-disable-next-line require-atomic-updates
    ctx.meta.$responseHeaders = { Authorization: `Bearer ${token}` };
    return user;
  }

  @Get<RestOptions>('/logout', {
    name: 'logout'
  })
  logout(ctx: Context<{}, UserAuthMeta>) {
    console.log('user logout', ctx.meta.user);
  }

  @Post<RestOptions>('/', {
    name: 'create',
    roles: UserRole.SUPERADMIN,
    params: {
      ...validateUserBase,
      password: 'string'
    }
  })
  async createUser(ctx: Context<UserCreateParams, UserAuthMeta>) {
    const entity = ctx.params;
    if (entity.login) {
      const found = await this.adapter.findOne<IUser>({ login: entity.login });
      if (found) {
        throw new moleculer.Errors.MoleculerClientError('Username exist!', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY, '', [
          { field: 'login', message: 'duplicated' }
        ]);
      }
    }
    if (entity.email) {
      const found = await this.adapter.findOne<IUser>({ email: entity.email });
      if (found) {
        throw new moleculer.Errors.MoleculerClientError('Email exist!', constants.HTTP_STATUS_UNPROCESSABLE_ENTITY, '', [
          { field: 'email', message: 'duplicated' }
        ]);
      }
    }

    entity.password = encryptPassword(entity.password);
    const parsedEntity = new JsonConvert().deserializeObject(entity, UserEntity).getMongoEntity();
    const modEntity = this.updateAuthor(parsedEntity, { creator: ctx.meta.user });
    return this._create(ctx, modEntity);
  }

  @Get<RestOptions>('/', {
    name: 'get',
    cache: {
      keys: ['id', 'populate', 'fields', 'mapping']
    }
  })
  async getMe(ctx: Context<DbContextParameters, UserAuthMeta>) {
    const params = this.sanitizeParams(ctx, ctx.params);
    return this._get(ctx, { ...params, id: ctx.meta.user._id });
  }

  @Get<RestOptions>('/:id', {
    name: 'get.id',
    roles: UserRole.SUPERADMIN,
    cache: {
      keys: ['id', 'populate', 'fields', 'mapping']
    }
  })
  async getUser(ctx: Context<UserGetParams, UserAuthMeta>) {
    const params = this.sanitizeParams(ctx, ctx.params);
    return this._get(ctx, params);
  }

  @Put<RestOptions>('/:id', {
    name: 'update',
    roles: UserRole.SUPERADMIN,
    params: {
      ...validateUserBaseOptional,
      password: { type: 'string', optional: true },
      id: 'string'
    }
  })
  async updateUser(ctx: Context<UserUpdateParams, UserAuthMeta>) {
    const { id } = ctx.params;
    delete ctx.params.id;
    const user = await this.getById<IUser>(id);
    if (!user) {
      throw new moleculer.Errors.MoleculerClientError('User not found!', constants.HTTP_STATUS_NOT_FOUND);
    }
    const newUser = this.updateAuthor(
      {
        ...user,
        ...ctx.params,
        _id: id
      },
      { modifier: ctx.meta.user }
    );
    const { password } = ctx.params;
    if (password) {
      newUser.password = encryptPassword(password);
    }
    return this._update(ctx, newUser);
  }

  @Delete<RestOptions>('/:id', {
    name: 'remove',
    roles: UserRole.SUPERADMIN
  })
  async deleteUser(ctx: Context<UserDeleteParams, UserAuthMeta>) {
    // TODO: Broadcast to delete in all related services
    if (ctx.params.id === ctx.meta.user._id) {
      throw new moleculer.Errors.MoleculerClientError('User can not delete itself!', constants.HTTP_STATUS_BAD_REQUEST);
    }
    const params = this.sanitizeParams(ctx, ctx.params);
    await this._remove(ctx, params);
    // eslint-disable-next-line require-atomic-updates
    ctx.meta.$statusCode = constants.HTTP_STATUS_ACCEPTED;
  }

  @Get<RestOptions>('/list', {
    name: 'list',
    roles: UserRole.SUPERADMIN,
    cache: {
      keys: ['populate', 'fields', 'page', 'pageSize', 'sort', 'search', 'searchFields', 'query']
    }
  })
  async listAllUsers(ctx: Context<DbContextParameters, UserAuthMeta>) {
    const params = this.sanitizeParams(ctx, ctx.params);
    return this._list(ctx, params);
  }

  @Method
  generateJWT(user: UserJWT) {
    const exp = new Date();
    exp.setDate(exp.getDate() + 60);

    return jwt.sign(
      {
        ...user,
        exp: Math.floor(exp.getTime() / 1000)
      },
      this.settings.JWT_SECRET
    );
  }

  @Method
  private updateAuthor(
    user: IUser,
    mod: {
      creator?: UserJWT;
      modifier?: UserJWT;
    }
  ) {
    const { creator, modifier } = mod;
    let result = { ...user } as IUser;
    if (creator) {
      result = { ...result, createdBy: creator._id, createdDate: new Date() };
    }
    if (modifier) {
      result = { ...result, lastModifiedBy: modifier._id, lastModifiedDate: new Date() };
    }
    return result;
  }
}
