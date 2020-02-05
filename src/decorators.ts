/**
 * decorators.ts
 *
 * Decorators for providing and injecting dependencies via an `Injector`.
 *
 * @author Donald Isaac
 * @license MIT
 */
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
export interface InjectPropOptions<T> {
    token?: InjectorToken<T>;
    providedIn?: Injector;
}

// export function Inject(): ClassDecorator {
//   return function (target: Function): void {
//     // empty
//   };
// }
// export function Inject<T>(token: InjectorToken<T>): PropertyOrClassDecorator;
// export function Inject<T>(token: InjectPropOptions<T>): PropertyOrClassDecorator;
// export function Inject<T>(opts: InjectorToken<T> | InjectPropOptions<T>): PropertyOrClassDecorator {
//   return function (target: Object | Function, key?: string | symbol): void {
//     if (key) { // key exists iff Inject is used as a property decorator
//       let { token, providedIn } = opts;

//       if (!token)
//         token = Reflect.getMetadata('design:type', target, key);

//       if (providedIn) {
//         let dependency = ((opts.providedIn) as Injector).resolve<any, any>(token as InjectorToken<any>)[0];

//         Object.defineProperty(target, key, {
//           value: dependency
//         });
//       }
//     } else {
//       // TODO
//     }
//   };
// }


export function Inject<T>(): PropertyOrClassDecorator;
export function Inject<T>(token: InjectorToken<T>): PropertyOrClassDecorator;
export function Inject<T>(providedIn: Injector): PropertyOrClassDecorator;
export function Inject<T>(opts: InjectPropOptions<T>): PropertyOrClassDecorator;
export function Inject<T>(arg?: any): PropertyOrClassDecorator {
    let token: InjectorToken<T>;
    let injector: Injector;

    if (!arg) {                                     // No param provided
        injector = Injector.GlobalInjector;
    } else if (arg.token || arg.providedIn) {       // InjectPropOptions provided
        token = arg.token;
        injector = arg.providedIn || Injector.GlobalInjector;
    } else if (arg instanceof Injector) {            // Injector only provided
        injector = arg as Injector;
    } else {
        token = arg as InjectorToken<T>;              // InjectorToken only provided
        injector = Injector.GlobalInjector;
    }

    return function (target: Object | Function, key?: string | symbol): void {
        // key exists iff Inject is used as a property decorator
        if (key) {
            token = token || Reflect.getMetadata('design:type', target, key);
            // No token provided AND no token could be resolved
            if (!token)
                throw new Error(`Unable to resolve InjectorToken for property ${String(key)}`);

            // let dependency = injector.get(token);
            let [dependency] = injector.resolve<any, any>(token);
            Object.defineProperty(target, key, {
                value: dependency
            });
        } else { // No key means that this is a class decorator
            // TODO
        }
    };
}
