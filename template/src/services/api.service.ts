import moleculer, { Context } from 'moleculer';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import ApiGateway from 'moleculer-web';
import { Response } from 'express';
import pick from 'lodash/pick';
import { Config } from '../common';
import { Method, Service } from '@d0whc3r/moleculer-decorators';
import { RequestMessage, UserAuthMeta, UserJWT, UserRolesParams, UserTokenParams } from '../types';

@Service({
  name: 'api',
  mixins: [ApiGateway],
  settings: {
    // Exposed port
    port: Config.PORT,

    // Exposed IP
    ip: Config.HOST,

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
    use: [
      cors({
        origin: '*',
        methods: 'GET,HEAD,PUT,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Type', 'Authorization']
      }),
      cookieParser(),
      helmet()
    ],

    routes: [
      {
        path: '/',

        whitelist: ['**'],

        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: true,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: true,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        /**
         * Before call hook. You can check the request.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @param {ServerResponse} res
         * @param {Object} data
         *
         onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				}, */

        /**
         * After call hook. You can modify the data.
         * @param {Context} ctx
         * @param {Object} route
         * @param {IncomingRequest} req
         * @param {ServerResponse} res
         * @param {Object} data
         onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB'
          },
          urlencoded: {
            extended: true,
            limit: '1MB'
          }
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: Config.MAPPING_POLICY, // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true
      }
    ],

    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: 'info',
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: false,

    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: 'public',

      // Options to `server-static` module
      options: {}
    }
  }
})
export default class ApiService extends moleculer.Service {
  onError(req: RequestMessage, res: Response, err: any) {
    // Return with the error as JSON object
    res.setHeader('Content-type', 'application/json; charset=utf-8');
    res.writeHead(err.code || 500);

    if (err.code == 422) {
      const o: any = {};
      err.data.forEach((e: any) => {
        const field = e.field.split('.').pop();
        o[field] = e.message;
      });

      res.end(JSON.stringify({ errors: o }, null, 2));
    } else {
      const errObj = pick(err, ['name', 'message', 'code', 'type', 'data']);
      res.end(JSON.stringify(errObj, null, 2));
    }
    this.logResponse(req, res, err ? err.ctx : null);
  }

  @Method
  async authenticate(ctx: Context<{}, UserAuthMeta>, route: any, req: RequestMessage) {
    const auth = req.headers.authorization;

    if (auth) {
      const type = auth.split(' ')[0];
      let token: string | undefined;
      if (type === 'Token' || type === 'Bearer') {
        token = auth.split(' ')[1];
      }

      if (token) {
        const user = await ctx.call<UserJWT | undefined, UserTokenParams>('user.resolveToken', { token });
        if (user) {
          return Promise.resolve(user);
        }
      }
      return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null));
    }
    return Promise.resolve(null);
  }

  @Method
  async authorize(ctx: Context<{}, UserAuthMeta>, route: any, req: RequestMessage) {
    const user = ctx.meta.user;

    if (req.$action.auth) {
      if (!user) {
        return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, null));
      }
      const aroles = req.$action.roles || [];
      const roles = Array.isArray(aroles) ? aroles : [aroles];
      const valid = await ctx.call<boolean, UserRolesParams>('user.validateRole', { roles });
      if (!valid) {
        return Promise.reject(new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null));
      }
      return Promise.resolve({ ...ctx, meta: { user } });
    }
    return Promise.resolve(null);
  }
}
