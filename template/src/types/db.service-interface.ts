import moleculer, { Context } from 'moleculer';
import { DbAdapter, DbContextParameters } from 'moleculer-db';

export class MoleculerDBService<T, R> extends moleculer.Service<T> {
  metadata!: {
    $category: string;
    $official: boolean;
    $name: string;
    $version: string;
    $repo?: string;
  };
  adapter!: DbAdapter;

  connect!: () => Promise<void>;

  /**
   * Disconnect from database.
   */
  disconnect!: () => Promise<void>;

  /**
   * Sanitize context parameters at `find` action.
   *
   * @param {Context} ctx
   * @param {any} origParams
   * @returns {Promise}
   */
  sanitizeParams!: (ctx: Context, params?: DbContextParameters) => Promise<void>;

  /**
   * Get entity(ies) by ID(s).
   *
   * @methods
   * @param {String|Number|Array} id - ID or IDs.
   * @param {Boolean} decoding - Need to decode IDs.
   * @returns {Object|Array<Object>} Found entity(ies).
   */
  getById!: <R>(id: string | number | string[], decoding?: boolean) => Promise<R>;

  /**
   * Clear the cache & call entity lifecycle events
   *
   * @param {String} type
   * @param {Object|Array|Number} json
   * @param {Context} ctx
   * @returns {Promise}
   */
  entityChanged!: <R>(type: string, json: number | any[] | any, ctx: Context) => Promise<R>;

  /**
   * Clear cached entities
   *
   * @methods
   * @returns {Promise}
   */
  clearCache!: () => Promise<void>;

  /**
   * Transform the fetched documents
   *
   * @param {Array|Object}  docs
   * @param {Object}      Params
   * @returns {Array|Object}
   */
  transformDocuments!: <R>(ctx: Context, params: any, docs: any) => R;

  /**
   * Filter fields in the entity object
   *
   * @param {Object}  doc
   * @param {Array}  fields  Filter properties of model.
   * @returns  {Object}
   */
  filterFields!: <R>(doc: any, fields: any[]) => R;

  /**
   * Authorize the required field list. Remove fields which is not exist in the `this.settings.fields`
   *
   * @param {Array} fields
   * @returns {Array}
   */
  authorizeFields!: <R>(fields: any[]) => R[];

  /**
   * Populate documents.
   *
   * @param {Context}    ctx
   * @param {Array|Object}  docs
   * @param {Array}      populateFields
   * @returns  {Promise}
   */
  populateDocs!: <R>(ctx: Context, docs: any, populateFields: any[]) => Promise<R>;

  /**
   * Validate an entity by validator.
   *
   * @param {T} entity
   * @returns {Promise}
   */
  validateEntity!: <T, R>(entity: T) => Promise<R>;

  /**
   * Encode ID of entity.
   *
   * @methods
   * @param {any} id
   * @returns {R}
   */
  encodeID!: <R>(id: any) => R;

  /**
   * Decode ID of entity.
   *
   * @methods
   * @param {R} id
   * @returns {R}
   */
  decodeID!: <R>(id: any) => R;

  /**
   * Service started lifecycle event handler
   */
  // started!: () => Promise<void>;

  /**
   * Service stopped lifecycle event handler
   */
  // stopped!: () => Promise<void>;

  /**
   * Service created lifecycle event handler
   */
  // created!: () => Promise<void>;
}
