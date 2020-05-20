export * from './interfaces';
export * from './greeter';
export { MoleculerDBService } from './db.service-interface';
{{#userService}}export * from './user';
export { IUser } from '../entities/user.entity';
export { IUserBase } from './user';{{/userService}}
{{#dbService}}export * from './products';
export { IProduct } from '../entities/product.entity';{{/dbService}}
