
/**
 * Index.ts
 *
 * Exposes Injectinator's public interface for encapsulation and convenience.
 *
 * @author Donald Isaac
 * @license MIT
 */
import 'reflect-metadata';

export {
    Type,
    InjectorToken,
    FactoryFunction
} from './types';
export {
    Injectable,
    Inject,
    Singleton
} from './decorators';
export * from './injector';
