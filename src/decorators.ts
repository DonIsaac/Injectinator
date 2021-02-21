/**
 * Decorators.ts
 *
 * Decorators for providing and injecting dependencies via an `Injector`.
 *
 * @author Donald Isaac
 * @license MIT
 */
import 'reflect-metadata';
import { InjectorToken, Type } from './types';
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
export type InjectionDecorator = (
    target: Function | Object,
    prop?: string | symbol,
    index?: number
) => void;

/** @protected */
export const INJECTABLE_SYMBOL = Symbol.for('@@Injectable');

/** @protected */
export const TOKEN_SYMBOL = Symbol.for('di:token');

/** @protected */
export const SINGLETON_SYMBOL = Symbol.for('di:singleton');

// TODO: This token isn't ever used. Should it be implemented or removed?
/**
 *
 * @param token
 */
export function Injectable (token?: InjectorToken<any>): ClassDecorator {
    return function _InjectableDecorator (target: Function): void {

        if (!token) {
            // eslint-disable-next-line no-param-reassign
            token = target as Type<any>;
        }

        Reflect.defineMetadata(TOKEN_SYMBOL, token, target);
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

/**
 * Marks a dependency class as a singleton. This is a convienence decorator
 * for the existing 'singleton' property accepted in the options object
 * for `Injector#bind`. Setting the `singleton` property to `false` during
 * binding will override this decorator.
 *
 * @param target
 *
 * @see Injector#bind
 */
export function Singleton (target: Function): void {

    Reflect.defineMetadata(
        SINGLETON_SYMBOL,
        true,
        target
    );

}

/**
 *
 */
export function Inject<T>(): InjectionDecorator;
export function Inject<T>(token: InjectorToken<T>): InjectionDecorator;
export function Inject<T>(providedIn: Injector): InjectionDecorator;
export function Inject<T>(opts: InjectPropOptions<T>): InjectionDecorator;

/**
 *
 * @param arg
 */
export function Inject<T> (arg?: InjectorToken<T> | Injector | InjectPropOptions<T>): InjectionDecorator {

    let injector: Injector,
        token: InjectorToken<T> | undefined;

    // No param provided
    if (!arg) {
        injector = Injector.GlobalInjector;

    // InjectPropOptions provided
    } else if (
        (arg as InjectPropOptions<T>).token ||
        (arg as InjectPropOptions<T>).providedIn
    ) {
        // eslint-disable-next-line prefer-destructuring
        token = (arg as InjectPropOptions<T>).token;
        injector = (arg as InjectPropOptions<T>).providedIn ?? Injector.GlobalInjector;

    // Injector only provided
    } else if (arg instanceof Injector) {
        injector = arg as Injector;

    // InjectorToken only provided
    } else {
        token = arg as InjectorToken<T>;
        injector = Injector.GlobalInjector;
    }

    return function _InjectDecorator (target: Object | Function, key?: string | symbol): void {

        // Key exists iff Inject is used as a property decorator
        if (key) {
            token = token ?? Reflect.getMetadata('design:type', target, key);
            // No token provided AND no token could be resolved
            if (!token) {
                throw new Error(`Unable to resolve InjectorToken for property ${String(key)}`);
            }

            // Let dependency = injector.get(token);
            const [dependency] = injector.resolve<any, any>(token);

            Object.defineProperty(target, key, { value: dependency });

        } else { // No key means that this is a class decorator
            // TODO
        }

    };

}
