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

/**
 * An InjectionDecorator is a decorator function that injects a dependency into
 * some dependent. This may be a class, property, or parameter decorator.
 *
 * @see https://www.typescriptlang.org/docs/handbook/decorators
 *
 * @param target    The constructor function for a static property, or the
 *                  class's prototype for an instance property
 * @param prop      The name of the property if this is a property or parameter
 *                  decorator, undefined otherwise.
 * @param index     The ordinal index of the parameter inside the function's
 *                  parameter list if this should be a parameter decorator,
 *                  undefined otherwise
 */
export type InjectionDecorator = (target: Function | Object, prop?: string | symbol, index?: number) => void;
export const INJECTABLE_SYMBOL = Symbol.for('@@Injectable');

// TODO: This token isn't ever used. Should it be implemented or removed?
export function Injectable(token?: InjectorToken<any>): ClassDecorator {
    return function (target: Function): void {
        if (!token)
            token = target as Type<any>;

        Reflect.defineMetadata('di:token', token, target);
        Reflect.defineMetadata(INJECTABLE_SYMBOL, true, target);
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


export function Inject<T>(): InjectionDecorator;
export function Inject<T>(token: InjectorToken<T>): InjectionDecorator;
export function Inject<T>(providedIn: Injector): InjectionDecorator;
export function Inject<T>(opts: InjectPropOptions<T>): InjectionDecorator;
export function Inject<T>(arg?: any): InjectionDecorator {
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
