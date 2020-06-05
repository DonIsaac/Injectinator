/**
 * index.ts
 *
 * Exposes Injectinator's public interface for encapsulation and convenience.
 *
 * @author Donald Isaac
 * @license MIT
 */
export {
    Type,
    InjectorToken,
    FactoryFunction,
} from './di';
export {
    Injectable,
    Inject,
    Singleton,
} from './decorators';
export * from './injector';
