import { Get, Service } from '@d0whc3r/moleculer-decorators';
import moleculer, { Context } from 'moleculer';
import { GreeterWelcomeParams } from '../types';

@Service({
  name: 'greeter',
  settings: {
    rest: '/api/greeter'
  }
})
export default class GreeterService extends moleculer.Service {
  @Get('/hello', {
    name: 'hello'
  })
  getHello() {
    return 'Hello Moleculer';
  }

  @Get('/welcome', {
    name: 'welcome',
    params: {
      name: 'string'
    }
  })
  getWelcome(ctx: Context<GreeterWelcomeParams, {}>) {
    return `Welcome, ${ctx.params.name}`;
  }
}
