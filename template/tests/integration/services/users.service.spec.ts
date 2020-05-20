import { Service, ServiceBroker } from 'moleculer';
import { AUTHORIZATION_KEY, checkWrongToken, clearDB, randString, testConfig, wait } from '../../helpers/helper';
import request from 'supertest';
import TestingService from '../../../src/services/user.service';
import ApiService from '../../../src/services/api.service';
import { constants } from 'http2';
import { adminUser, disabledUser, getJWT, simpleUser, superAdminUser } from '../../helpers/user.helper';
import { UserCreateParams, UserJWT, UserLang, UserRole, UserUpdateParams } from '../../../src/types';
import { Config } from '../../../src/common';

async function loginTest(server: Service, info: { user: UserJWT; password: string; url?: string }) {
  const { user, password, url = '/api/user/login' } = info;
  const response = await request(server).post(url).send({
    login: user.login,
    password
  });
  expect(response.status).toBe(constants.HTTP_STATUS_OK);
  expect(response.body)
    .toBeDefined()
    .toBeObject()
    .toContainEntries([
      ['login', user.login],
      ['email', user.email],
      ['firstName', user.firstName],
      ['lastName', user.lastName]
    ]);
  expect(response.header).toBeDefined().toContainKey(AUTHORIZATION_KEY.toLowerCase());
  expect(response.header.authorization).toBeDefined().toStartWith('Bearer ');
}

const broker = new ServiceBroker(testConfig);
const userService = broker.createService(TestingService);
const apiService = broker.createService(ApiService);

describe('Integration tests for Users service', () => {
  let server: Service;
  let testUrl = '';
  let token = '';

  beforeEach(async () => {
    await clearDB(Config.DB_USER);
    await broker.start();
    await broker.waitForServices(userService.name);
    await broker.waitForServices(apiService.name);
    if (!server) {
      await wait(1);
    }
    // eslint-disable-next-line require-atomic-updates
    server = apiService.server;
    await wait(0);
  });

  afterEach(async () => {
    await broker.stop();
    await clearDB(Config.DB_USER);
  });
  beforeEach(() => expect.hasAssertions());

  describe('login', () => {
    beforeEach(() => {
      testUrl = '/api/user/login';
    });
    it('wrong login', async () => {
      const response = await request(server).post(testUrl).send({
        login: 'test',
        password: 'not-valid'
      });
      expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
      expect(response.body).toBeDefined().toBeObject().toContainKey('data').toContainEntry(['name', 'MoleculerClientError']);
      expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
      expect(response.body.data[0])
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['field', 'login/password'],
          ['message', 'not found']
        ]);
    });
    it('wrong password', async () => {
      const response = await request(server).post(testUrl).send({
        login: superAdminUser.login,
        password: 'not-valid'
      });
      expect(response.status).toBe(constants.HTTP_STATUS_UNPROCESSABLE_ENTITY);
      expect(response.body).toBeDefined().toBeObject().toContainKey('data').toContainEntry(['name', 'MoleculerClientError']);
      expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
      expect(response.body.data[0])
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['field', 'login/password'],
          ['message', 'not found']
        ]);
    });
    it('disabled user', async () => {
      const response = await request(server).post(testUrl).send({
        login: disabledUser.login,
        password: '123456'
      });
      expect(response.status).toBe(constants.HTTP_STATUS_FORBIDDEN);
      expect(response.body).toBeDefined().toBeObject().toContainKey('data').toContainEntry(['name', 'MoleculerClientError']);
      expect(response.body.data).toBeDefined().toBeArray().toHaveLength(1);
      expect(response.body.data[0])
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['field', 'disabled'],
          ['message', 'user disabled']
        ]);
    });
    it('good login', async () => {
      await loginTest(server, { user: superAdminUser, password: '123456' });
    });
  });

  describe('Get User', () => {
    beforeEach(async () => {
      testUrl = '/api/user';
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl);
    });
    it('info', async () => {
      const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['login', superAdminUser.login],
          ['email', superAdminUser.email]
        ]);
    });
  });

  describe('Get All Users', () => {
    beforeEach(async () => {
      testUrl = '/api/user/all';
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl);
    });
    it('info', async () => {
      const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['page', 1],
          ['pageSize', 10],
          ['totalPages', 1]
        ]);
    });
    it('info with admin', async () => {
      const adminToken = await getJWT(server, adminUser.login);
      await checkWrongToken(server, testUrl, { token: adminToken });
    });
  });

  describe('Get User by id', () => {
    beforeEach(async () => {
      testUrl = `/api/user/${disabledUser._id}`;
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl);
    });
    it('info', async () => {
      const response = await request(server).get(testUrl).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['login', disabledUser.login],
          ['email', disabledUser.email]
        ]);
    });
    it('info with admin', async () => {
      const adminToken = await getJWT(server, adminUser.login);
      await checkWrongToken(server, testUrl, { token: adminToken, method: 'get' });
    });
  });

  describe('Create Users', () => {
    const password = randString();
    const user: UserCreateParams = {
      login: `test-${randString()}`,
      password,
      firstName: 'test',
      lastName: 'test',
      email: `test-${randString()}@test.com`,
      roles: [UserRole.USER],
      langKey: UserLang.ES,
      activated: true
    };
    beforeEach(async () => {
      testUrl = '/api/user';
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl, { method: 'post', body: user });
    });
    it('create with admin', async () => {
      const adminToken = await getJWT(server, adminUser.login);
      await checkWrongToken(server, testUrl, { token: adminToken, method: 'post', body: user });
    });
    it('create + login', async () => {
      const response = await request(server).post(testUrl).send(user).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['login', user.login],
          ['email', user.email]
        ]);
      await loginTest(server, { user: response.body, password });
    });
  });

  describe('Update user by id', () => {
    const user: UserUpdateParams = {
      ...simpleUser,
      firstName: 'other name',
      id: simpleUser._id
    };
    beforeEach(async () => {
      testUrl = `/api/user/${simpleUser._id}`;
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl, { method: 'put', body: user });
    });
    it('info with admin', async () => {
      const adminToken = await getJWT(server, adminUser.login);
      await checkWrongToken(server, testUrl, { token: adminToken, method: 'put', body: user });
    });
    it('update + login', async () => {
      const response = await request(server).put(testUrl).send(user).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['firstName', user.firstName],
          ['email', user.email]
        ]);
      await loginTest(server, { user: response.body, password: '123456' });
    });
    it('update password + login', async () => {
      const password = 'test-password';
      const response = await request(server)
        .put(testUrl)
        .send({ ...user, password })
        .set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_OK);
      expect(response.body)
        .toBeDefined()
        .toBeObject()
        .toContainEntries([
          ['firstName', user.firstName],
          ['email', user.email]
        ]);
      await loginTest(server, { user: response.body, password });
    });
  });

  describe('Delete User by id', () => {
    beforeEach(async () => {
      testUrl = `/api/user/${disabledUser._id}`;
      token = await getJWT(server);
    });
    it('wrong token', async () => {
      await checkWrongToken(server, testUrl, { method: 'delete' });
    });
    it('delete', async () => {
      const response = await request(server).delete(testUrl).set(AUTHORIZATION_KEY, token);
      expect(response.status).toBe(constants.HTTP_STATUS_ACCEPTED);
    });
    it('delete with admin', async () => {
      const adminToken = await getJWT(server, adminUser.login);
      await checkWrongToken(server, testUrl, { token: adminToken, method: 'delete' });
    });
  });
});
