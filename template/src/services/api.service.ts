import moleculer, { Context, Errors } from 'moleculer';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import ApiGateway from 'moleculer-web';
import { Response } from 'express';
import pick from 'lodash/pick';
import { Config } from '../common';
import { Method, Service } from '@d0whc3r/moleculer-decorators';
import { RequestMessage, UserAuthMeta, UserJWT, UserRole, UserRolesParams, UserTokenParams } from '../types';

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
        allowedHeaders: '*',
        exposedHeaders: '*',
        credentials: true,
        maxAge: undefined
        // allowedHeaders: ['Content-Type', 'Authorization'],
        // exposedHeaders: ['Content-Type', 'Authorization']
      }),
      cookieParser(),
      helmet()
    ],

    rateLimit: {
      window: Config.RATE_LIMIT_WINDOW,
      limit: Config.RATE_LIMIT,
      headers: true
    },

    etag: true,

    path: '/',
    logging: true,

    routes: [
      {
        path: '/auth',
        authorization: false,
        authentication: false,
        whitelist: ['user.login'],
        aliases: {
          'POST /login': 'user.login'
        }
      },
      {
        path: '/admin',
        whitelist: ['$node.*', 'api.listAliases'],
        authorization: true,
        authentication: true,
        roles: [UserRole.SUPERADMIN],
        aliases: {
          'GET /health': '$node.health',
          'GET /services': '$node.services',
          'GET /actions': '$node.actions',
          'GET /list': '$node.list',
          'GET /metrics': '$node.metrics',
          'GET /events': '$node.events',
          'GET /options': '$node.options',
          'GET /aliases': 'api.listAliases'
        }
      },
      {
        path: '/api/document',
        authentication: true,
        authorization: true,
        roles: [],
        bodyParsers: {
          json: false,
          urlencoded: false
        },

        aliases: {
          'GET /download': 'file.get'
        },

        // https://github.com/mscdex/busboy#busboy-methods
        busboyConfig: {
          limits: {
            files: 1
          }
        },
        mappingPolicy: 'restrict'
      },
      {
        path: '/api/document',
        authentication: true,
        authorization: true,
        roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MODIFIER],
        bodyParsers: {
          json: false,
          urlencoded: false
        },

        aliases: {
          'POST /upload': 'multipart:file.save',
          'PUT /upload': 'stream:file.save',
          'POST /multi': {
            type: 'multipart',
            // Action level busboy config
            busboyConfig: {
              limits: {
                files: 3,
                fileSize: 50 * 1024 * 1024
              }
            },
            action: 'file.save'
          }
        },

        // https://github.com/mscdex/busboy#busboy-methods
        busboyConfig: {
          limits: {
            files: 1
          }
        },
        mappingPolicy: 'restrict'
      },
      {
        path: '/api',
        whitelist: [/^(?!\$node\..*|user\.login|api\.listAliases).*/],

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
            limit: '50MB'
          },
          urlencoded: {
            extended: true,
            limit: '50MB'
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

    if (err.code === 422) {
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
  async rejectAuth(ctx: Context<Record<string, unknown>, UserAuthMeta>, error: Errors.MoleculerError) {
    if (ctx.meta.user) {
      const context = pick(
        ctx,
        'nodeID',
        'id',
        'event',
        'eventName',
        'eventType',
        'eventGroups',
        'parentID',
        'requestID',
        'caller',
        'params',
        'meta',
        'locals'
      );
      const action = pick(ctx.action, 'rawName', 'name', 'params', 'rest');
      const logInfo = {
        action: 'AUTH_FAILURE',
        details: {
          error,
          context,
          action,
          meta: ctx.meta
        }
      };
      this.logger.error(logInfo);
    }
    return Promise.reject(error);
  }

  @Method
  async authenticate(ctx: Context<Record<string, unknown>, UserAuthMeta>, route: any, req: RequestMessage) {
    const auth = req.headers.authorization;

    if (auth) {
      const type = auth.split(' ')[0];
      let token: string | undefined;
      if (type === 'Token' || type === 'Bearer') {
        token = auth.split(' ')[1];
      }

      if (token) {
        const user = await ctx.call<UserJWT | undefined, UserTokenParams>('user.resolveToken', { token });
        if (user && user.active) {
          return Promise.resolve(user);
        }
      }
      return this.rejectAuth(ctx, new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null));
    }
    return this.rejectAuth(ctx, new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, null));
  }

  @Method
  async authorize(ctx: Context<Record<string, unknown>, UserAuthMeta>, route: any, req: RequestMessage) {
    const user = ctx.meta.user;

    if (req.$action.auth === false) {
      return Promise.resolve(null);
    }
    if (!user) {
      return this.rejectAuth(ctx, new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN, null));
    }
    const aroles = Array.isArray(req.$action.roles) ? req.$action.roles : [req.$action.roles];
    const oroles = Array.isArray(req.$route.opts.roles) ? req.$route.opts.roles : [req.$route.opts.roles];
    const allRoles = [...aroles, ...oroles].filter(Boolean);
    const roles = [...new Set(allRoles)];
    const valid = await ctx.call<boolean, UserRolesParams>('user.validateRole', { roles });
    if (!valid) {
      return this.rejectAuth(ctx, new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null));
    }
    return Promise.resolve(ctx);
  }
}
