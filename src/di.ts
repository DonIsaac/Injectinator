/**
 * di.ts
 * 
 * Defines globally used data types and interfaces.
 *
 * @author Donald Isaac
 * @license MIT
 *
 */

import 'reflect-metadata';

/**
 * A class/constructor/newable function with type `T`.
 */
export interface Type<T> extends NewableFunction {
  new(...args: any[]): T;
}

/**
 * Injector Tokens are used to resolve dependencies in the `Injector`. They
 * are basically typed keys.
 *
 * @see Injector
 */
export type InjectorToken<T> = string | symbol | Type<T>;

/**
 * A factory function that creates an object or new instance of a class.
 */
export type FactoryFunction<T> = (...args: any[]) => T;
// T extends (...args: InjectorToken<any>[]) => infer U ? U : any;
