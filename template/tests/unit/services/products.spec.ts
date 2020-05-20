import Moleculer, { Context, ServiceBroker } from 'moleculer';
import TestService from '../../../src/services/products.service';
import ValidationError = Moleculer.Errors.ValidationError;

describe('Test "products" service', () => {
  describe('Test actions', () => {
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);

    jest.spyOn(service.adapter, 'updateById');
    jest.spyOn(service, 'transformDocuments');
    jest.spyOn(service, 'entityChanged');

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    const record = {
      _id: '123',
      name: 'Awesome thing',
      price: 999,
      quantity: 25,
      createdAt: Date.now()
    };

    describe('Test "products.increaseQuantity"', () => {
      it('should call the adapter updateById method & transform result', async () => {
        service.adapter.updateById.mockImplementation(async () => record);
        service.transformDocuments.mockClear();
        service.entityChanged.mockClear();

        const res = await broker.call('products.increaseQuantity', {
          id: '123',
          value: 10
        });
        expect(res).toEqual({
          _id: '123',
          name: 'Awesome thing',
          price: 999,
          quantity: 25
        });

        expect(service.adapter.updateById)
          .toBeCalledTimes(1)
          .toBeCalledWith('123', { $inc: { quantity: 10 } });

        expect(service.transformDocuments).toBeCalledTimes(1).toBeCalledWith(expect.any(Context), { id: '123', value: 10 }, record);

        expect(service.entityChanged)
          .toBeCalledTimes(1)
          .toBeCalledWith('updated', { _id: '123', name: 'Awesome thing', price: 999, quantity: 25 }, expect.any(Context));
      });
    });

    describe('Test "products.decreaseQuantity"', () => {
      it('should call the adapter updateById method & transform result', async () => {
        service.adapter.updateById.mockClear();
        service.transformDocuments.mockClear();
        service.entityChanged.mockClear();

        const res = await broker.call('products.decreaseQuantity', {
          id: '123',
          value: 10
        });
        expect(res).toEqual({
          _id: '123',
          name: 'Awesome thing',
          price: 999,
          quantity: 25
        });

        expect(service.adapter.updateById)
          .toBeCalledTimes(1)
          .toBeCalledWith('123', { $inc: { quantity: -10 } });

        expect(service.transformDocuments).toBeCalledTimes(1).toBeCalledWith(expect.any(Context), { id: '123', value: 10 }, record);

        expect(service.entityChanged)
          .toBeCalledTimes(1)
          .toBeCalledWith('updated', { _id: '123', name: 'Awesome thing', price: 999, quantity: 25 }, expect.any(Context));
      });

      it('should throw error if params is not valid', async () => {
        service.adapter.updateById.mockClear();
        service.transformDocuments.mockClear();
        service.entityChanged.mockClear();

        expect.assertions(2);
        try {
          await broker.call('products.decreaseQuantity', {
            id: '123',
            value: -5
          });
        } catch (err) {
          expect(err).toBeInstanceOf(ValidationError);
          expect(err.data).toEqual([
            {
              action: 'products.decreaseQuantity',
              actual: -5,
              field: 'value',
              message: "The 'value' field must be a positive number.",
              nodeID: broker.nodeID,
              type: 'numberPositive'
            }
          ]);
        }
      });
    });
  });

  xdescribe('Test methods', () => {
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);

    jest.spyOn(service.adapter, 'insertMany');
    jest.spyOn(service, 'seedDB');

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    describe('Test "seedDB"', () => {
      it('should be called after service started & DB connected', async () => {
        expect(service.seedDB).toBeCalledTimes(1).toBeCalledWith();
      });

      it('should insert 3 documents', async () => {
        expect(service.adapter.insertMany)
          .toBeCalledTimes(1)
          .toBeCalledWith([
            { name: 'Samsung Galaxy S10 Plus', quantity: 10, price: 704 },
            { name: 'iPhone 11 Pro', quantity: 25, price: 999 },
            { name: 'Huawei P30 Pro', quantity: 15, price: 679 }
          ]);
      });
    });
  });

  describe('Test hooks', () => {
    // const broker = new ServiceBroker({ logger: false });
    const createActionFn = jest.fn();
    // broker.createService(TestService, {
    //   name: 'products',
    //   actions: {
    //     create: {
    //       handler: createActionFn
    //     }
    //   }
    // });
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);
    service.actions.create = createActionFn;

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    xdescribe('Test before "create" hook', () => {
      it('should add quantity with zero', async () => {
        await broker.call('products.create', {
          id: '111',
          name: 'Test product',
          price: 100
        });

        expect(createActionFn).toBeCalledTimes(1);
        expect(createActionFn.mock.calls[0][0].params).toEqual({
          id: '111',
          name: 'Test product',
          price: 100,
          quantity: 0
        });
      });
    });
  });
});
