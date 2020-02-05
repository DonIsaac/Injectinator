import 'reflect-metadata';
import { InjectorToken, Type } from './di';
import { Injector } from './injector';

export type PropertyOrClassDecorator = (target: Object, propertyKey?: string | symbol) => void;

// TODO: This token isn't ever used. Should it be implemented or removed?
export function Injectable(token?: InjectorToken<any>): ClassDecorator {
  return function (target: Function): void {
    if (!token)
      token = target as Type<any>;

    Reflect.defineMetadata('di:token', token, target);
  };
}

export interface InjectOptions {
  providedIn?: Injector;
}
export interface InjectPropOptions {
  token?: InjectorToken<any>;
  providedIn?: Injector;
}

// export function Inject(): ClassDecorator {
//   return function (target: Function): void {
//     // empty
//   };
// }
export function Inject(opts: InjectPropOptions): PropertyOrClassDecorator {
  return function (target: Object | Function, key?: string | symbol): void {
    if (key) { // key exists iff Inject is used as a property decorator
      let { token, providedIn } = opts;

      if (!token)
        token = Reflect.getMetadata('design:type', target, key);

      if (providedIn) {
        let dependency = ((opts.providedIn) as Injector).resolve<any, any>(token as InjectorToken<any>)[0];

        Object.defineProperty(target, key, {
          value: dependency
        });
      }
    } else {

    }
  };
}
