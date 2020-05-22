import { Put, Service } from '@d0whc3r/moleculer-decorators';
import { Context } from 'moleculer';
import { dbProductMixin, eventsProductMixin } from '../mixins';
import { IProduct, MoleculerDBService, ProductServiceSettingsOptions, ProductsManipulateValueParams, ProductsServiceOptions } from '../types';

@Service<ProductsServiceOptions>({
  name: 'products',
  mixins: [dbProductMixin, eventsProductMixin],
  settings: {
    idField: '_id',
    pageSize: 10,
    rest: '/products',
    fields: ['_id', 'name', 'quantity', 'price'],
    entityValidator: {
      name: 'string|min:3',
      price: 'number|positive'
    }
  },
  hooks: {
    before: {
      /**
       * Register a before hook for the `create` action.
       * It sets a default value for the quantity field.
       *
       * @param {Context} ctx
       */
      create(ctx: Context<{ quantity: number }, {}>) {
        ctx.params.quantity = 0;
      }
    }
  }
})
export default class ProductsService extends MoleculerDBService<ProductServiceSettingsOptions, IProduct> {
  @Put('/:id/quantity/increase', {
    params: {
      id: 'string',
      value: {
        type: 'number',
        integer: true,
        positive: true
      }
    }
  })
  async increaseQuantity(ctx: Context<ProductsManipulateValueParams, {}>) {
    const doc = await this.adapter.updateById(ctx.params.id, { $inc: { quantity: ctx.params.value } });
    const json = await this.transformDocuments(ctx, ctx.params, doc);
    await this.entityChanged('updated', json, ctx);

    return json;
  }

  @Put('/:id/quantity/decrease', {
    params: {
      id: 'string',
      value: {
        type: 'number',
        integer: true,
        positive: true
      }
    }
  })
  async decreaseQuantity(ctx: Context<ProductsManipulateValueParams, {}>) {
    const doc = await this.adapter.updateById(ctx.params.id, { $inc: { quantity: -ctx.params.value } });
    const json = await this.transformDocuments(ctx, ctx.params, doc);
    await this.entityChanged('updated', json, ctx);

    return json;
  }

  /**
   * Fired after database connection establishing.
   */
  async afterConnected() {
    // await this.adapter.collection.createIndex({ name: 1 });
  }
}
