import moleculer, { Context, Endpoint, ServiceBroker } from 'moleculer';
import TestingService from '../../../src/services/user.service';
import {
  IUserBase,
  UserAuthMeta,
  UserCreateParams,
  UserDeleteParams,
  UserGetParams,
  UserJWT,
  UserLang,
  UserLoginMeta,
  UserLoginParams,
  UserRole,
  UserRolesParams,
  UserTokenParams,
  UserUpdateParams
} from '../../../src/types';
import { adminUser, disabledUser, simpleUser, superAdminUser } from '../../helpers/user.helper';
import { clearDB, randString, testConfig } from '../../helpers/helper';
import { Config } from '../../../src/common';

describe('Unit tests for User service', () => {
  const broker = new ServiceBroker(testConfig);
  const service = broker.createService(TestingService) as TestingService;
  const endpoint: Endpoint = {
    broker,
    id: Math.random().toString(36).slice(2),
    local: true,
    node: {},
    state: true
  };
  beforeEach(async () => {
    await clearDB(Config.DB_USER);
    await broker.start();
    await broker.waitForServices(service.name);
  });
  afterAll(async () => {
    await broker.stop();
    await clearDB(Config.DB_USER);
  });

  function getJWT(user: UserJWT) {
    return service.generateJWT(user);
  }

  const originalCall = Context.prototype.call;
  beforeEach(() => {
    Context.prototype.call = originalCall;
  });
  beforeEach(() => expect.hasAssertions());

  describe('actions', () => {
    let context: Context<UserTokenParams, {}>;
    beforeEach(() => {
      context = new Context<UserTokenParams, {}>(broker, endpoint);
    });
    it('resolve token', async () => {
      context.params = { token: getJWT(simpleUser) };
      try {
        const response = await service.resolveToken(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['_id', simpleUser._id],
            ['login', simpleUser.login]
          ]);
      } catch (err) {
        fail(err);
      }
    });
    it('resolve wrong token', async () => {
      context.params = { token: getJWT(simpleUser) + 'asdf' };
      try {
        const response = await service.resolveToken(context);
        expect(response).toBeUndefined();
      } catch (err) {
        fail(err);
      }
    });
    it('resolve not found user', async () => {
      context.params = { token: getJWT({ ...simpleUser, _id: '1234' }) };
      try {
        const response = await service.resolveToken(context);
        expect(response).toBeNull();
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('validate role', () => {
    let context: Context<UserRolesParams, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<UserRolesParams, UserAuthMeta>(broker, endpoint);
    });
    it('validate no role', async () => {
      context.params = {} as UserRolesParams;
      context.meta.user = simpleUser;
      try {
        const response = await service.validateRole(context);
        expect(response).toBe(true);
      } catch (err) {
        fail(err);
      }
    });
    it('validate empty role', async () => {
      context.params = { roles: [] };
      context.meta.user = simpleUser;
      try {
        const response = await service.validateRole(context);
        expect(response).toBe(true);
      } catch (err) {
        fail(err);
      }
    });
    it('validate valid role', async () => {
      context.params = { roles: [UserRole.USER] };
      context.meta.user = simpleUser;
      try {
        const response = await service.validateRole(context);
        expect(response).toBe(true);
      } catch (err) {
        fail(err);
      }
    });
    it('validate wrong role', async () => {
      context.params = { roles: [UserRole.SUPERADMIN] };
      context.meta.user = simpleUser;
      try {
        const response = await service.validateRole(context);
        expect(response).toBe(false);
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('create user', () => {
    let user: IUserBase;
    let context: Context<UserCreateParams, UserAuthMeta>;
    beforeEach(() => {
      const str = randString();
      user = {
        login: `login-${str}`,
        email: `${str}@test.com`,
        firstName: str,
        lastName: str,
        roles: [UserRole.USER],
        langKey: UserLang.ES,
        activated: true
      };
      context = new Context<UserCreateParams, UserAuthMeta>(broker, endpoint);
    });
    it('create user with wrong data', async () => {
      context.params = {} as UserCreateParams;
      try {
        await service.createUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
    it('create user', async () => {
      context.params = { ...user, password: randString() };
      context.meta = { user: superAdminUser };
      try {
        const response = await service.createUser(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['login', user.login],
            ['email', user.email]
          ]);
      } catch (err) {
        fail(err);
      }
    });
    it('create existing user login', async () => {
      context.params = { ...user, password: randString() };
      context.meta = { user: superAdminUser };
      await service.createUser(context);
      // eslint-disable-next-line require-atomic-updates
      context.params = { ...user, email: `${randString()}@test.net`, password: randString() };
      try {
        await service.createUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('create existing user email', async () => {
      context.params = { ...user, password: randString() };
      context.meta = { user: superAdminUser };
      await service.createUser(context);
      // eslint-disable-next-line require-atomic-updates
      context.params = { ...user, login: `other-login-${randString()}`, password: randString() };
      try {
        await service.createUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
  });

  describe('login user', () => {
    let context: Context<UserLoginParams, UserLoginMeta>;
    beforeEach(() => {
      context = new Context<UserLoginParams, UserLoginMeta>(broker, endpoint);
    });
    it('login wrong user', async () => {
      context.params = { login: 'not-valid-user', password: 'test' };
      try {
        await service.loginUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('login wrong password', async () => {
      context.params = { login: simpleUser.login, password: randString() };
      try {
        await service.loginUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('login disabled', async () => {
      context.params = { login: disabledUser.login, password: '123456' };
      try {
        await service.loginUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('login good', async () => {
      context.params = { login: simpleUser.login, password: '123456' };
      try {
        const response = await service.loginUser(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['login', simpleUser.login],
            ['email', simpleUser.email]
          ]);
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('get me', () => {
    let context: Context<{}, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<{}, UserAuthMeta>(broker, endpoint);
      context.action = { name: 'user.get' };
    });
    it('not found', async () => {
      context.meta = { user: { ...simpleUser, _id: 'xxx' } };
      try {
        await service.getMe(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('user info', async () => {
      context.meta = { user: { ...simpleUser } };
      try {
        const response = await service.getMe(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['login', simpleUser.login],
            ['email', simpleUser.email]
          ]);
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('get user', () => {
    let context: Context<UserGetParams, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<UserGetParams, UserAuthMeta>(broker, endpoint);
      context.action = { name: 'user.get.id' };
    });
    it('not found', async () => {
      context.meta = { user: superAdminUser };
      context.params = { id: 'xxx' };
      try {
        await service.getUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('user info', async () => {
      context.meta = { user: superAdminUser };
      context.params = { id: simpleUser._id };
      try {
        const response = await service.getUser(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['login', simpleUser.login],
            ['email', simpleUser.email]
          ]);
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('update user', () => {
    let context: Context<UserUpdateParams, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<UserUpdateParams, UserAuthMeta>(broker, endpoint);
    });
    it('not found', async () => {
      context.meta = { user: superAdminUser };
      context.params = {
        id: 'xxx',
        ...simpleUser
      };
      try {
        await service.updateUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('update', async () => {
      const firstName = 'changed';
      const lastName = 'changed name';
      context.meta = { user: superAdminUser };
      context.params = {
        id: simpleUser._id,
        ...simpleUser,
        firstName,
        lastName
      };
      try {
        const response = await service.updateUser(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['login', simpleUser.login],
            ['email', simpleUser.email]
          ]);
      } catch (err) {
        fail(err);
      }
    });
  });

  describe('delete user', () => {
    let context: Context<UserDeleteParams, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<UserDeleteParams, UserAuthMeta>(broker, endpoint);
      context.action = { name: 'user.remove' };
    });
    it('not found', async () => {
      context.meta = { user: superAdminUser };
      context.params = { id: 'xxx' };
      try {
        await service.deleteUser(context);
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
    it('delete', async () => {
      context.meta = { user: superAdminUser };
      context.params = { id: adminUser._id };
      await service.deleteUser(context);
      try {
        await broker.call('user.get.id', { id: adminUser._id });
      } catch (err) {
        expect(err).toBeInstanceOf(moleculer.Errors.MoleculerClientError);
      }
    });
  });

  describe('list users', () => {
    let context: Context<{}, UserAuthMeta>;
    beforeEach(() => {
      context = new Context<{}, UserAuthMeta>(broker, endpoint);
      context.action = { name: 'user.list' };
    });
    it('get all users', async () => {
      try {
        const response = await service.listAllUsers(context);
        expect(response)
          .toBeDefined()
          .toBeObject()
          .toContainEntries([
            ['page', 1],
            ['pageSize', 10],
            ['totalPages', 1]
          ]);
      } catch (err) {
        fail(err);
      }
    });
  });
});
