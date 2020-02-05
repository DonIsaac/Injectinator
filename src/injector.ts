/**
 * injector.ts
 *
 * Defines Provider and Injector classes/interfaces.
 *
 * @author Donald Isaac
 * @license MIT
 */
import { InjectorToken, Type, FactoryFunction } from './di';

/**
 * A `Provider` is used to deliver a dependency to an `Injector`.
 *
 * Providers determine what dependency is being provided and what processing
 * should be performed to create or modify it before its ready to be bound to
 * an `Injector`.
 *
 * @see Injector
 */
export interface Provider<T> {

    /**
     * The `InjectorToken` the dependency will be stored under once the
     * `Provider` is bound to an `Injector`.
     */
    token: InjectorToken<T>;

    /**
     * Creates a new instance of the dependency.
     *
     * If no arguments are passed, and the provider used requires arguments
     * (ex: providing a factory that takes arguments), the `Injector` attempts
     * to resolve the arguments. Note that how exactly arguments are used
     * depends on the specific `Provider` implementation.
     *
     * @param injector  The injector the provider is being bound to
     * @param args      Optional arguments to pass during dependency construction
     *
     * @returns a new instance of the dependency
     */
    create(injector: Injector, ...args: any[]): T;
}

/**
 * A provider for classes.
 *
 * The dependency actually provided is an instance object of the specified
 * class.
 *
 * @example
 * ```ts
 * // Some dependency class
 * class Foo { ... }
 *
 * // Another dependency class.
 * // Dependencies may also be dependents
 * @Injectable()
 * class Bar {
 *  constructor(private foo: Foo) { }
 *  public getFoo() { return this.foo; }
 * }
 *
 * let injector    = Injector.GlobalInjector;
 * let fooProvider = new ClassProvider<Foo>(Foo);
 * let barProvider = new ClassProovider<Bar>(Bar);
 *
 * // The providers create new instances of their classes and
 * // provide the results to the injector
 * injector
 *   .bind<Foo>(fooProvider)
 *   .bind<Bar>(barProvider);
 *
 * // returns an instance object of Foo
 * injector.get(Bar).getFoo();
 * ```
 */
export class ClassProvider<T> implements Provider<T> {

    clazz: Type<T>;
    token: InjectorToken<T>;

    constructor(clazz: Type<T>, token?: InjectorToken<T>) {
        this.clazz = clazz;

        if (token)
            this.token = token;
        else
            this.token = clazz;
    }

    public create(injector: Injector, ...args: any[]): T {
        // return new this.clazz(args);
        return injector.apply<T>(this.clazz);
    }
}

export class ObjectProvider<T> implements Provider<T> {
    obj: T;
    token: InjectorToken<T>;

    constructor(obj: T, token: InjectorToken<T>) {
        this.obj = obj;
        this.token = token;
    }

    public create(injector: Injector, ...args: any[]): T {
        return this.obj;
    }
}

export class FactoryProvider<T> implements Provider<T> {
    factory: FactoryFunction<T>;
    token: InjectorToken<T>;

    constructor(factory: FactoryFunction<T>, token: InjectorToken<T>) {
        this.factory = factory;
        this.token = token;
    }

    public create(injector: Injector, ...args: any[]): T {
        if (args.length !== 0) {
            return this.factory(args);
        } else { // No arguments provided on creation, resolve them from the injector.
            args = Reflect.getMetadata('design:paramtypes', this.factory) as InjectorToken<any>[];

            if (!args)
                throw new Error(`Could not call factory function: param types not found.`);

            let params = args.map(injector.apply);
            return this.factory(params);
        }
    }
}


/**
 * TODO
 */
export class Injector {

    // ---------------------------- GLOBAL INJECTOR ----------------------------

    /**
     * Shows if the Global Injector has been reassigned.
     *
     * Users may re-assign the global injector to something else once and only
     * once. This flag is __true__ if the global injector has been reassigned,
     * __false__ otherwise.
     */
    private static isReassigned = false;
    /**
     * The static Global Injector. This property should not be accessed
     * directly; It should be accessed via its public interface,
     * `Injector.GlobalInjector`.
     */
    private static _globalInjector: Injector;

    public static get GlobalInjector(): Injector {
        if (!this._globalInjector) {
            this._globalInjector = new Injector(null);
            this.isReassigned = true;
        }

        return this._globalInjector;
    }

    public static set GlobalInjector(val: Injector) {
        if (this.isReassigned)
            throw new Error('Attempted to re-assign the GlobalInjector after ' +
                'it has been used or previously assigned. Are you ' +
                'trying to reassign its value after using it?');

        this.isReassigned = true;
        this._globalInjector = val;
    }

    // -------------------------- INSTANCE PROPERTIES --------------------------

    /**
     * The `Map` that stores this injector's dependencies. `InjectorToken`s are
     * used as the keys for easy lookup.
     */
    private dependencies: Map<InjectorToken<any>, any>;
    /**
     * The next `Injector` in the resolution hierarchy. A value of `null` means
     * this `Injector` is the root `Injector` and therefore has no parent.
     */
    private parent: Injector | null;

    // ------------------------------ CONSTRUCTORS -----------------------------

    /**
     * Creates a new `Injector` instance.
     *
     * The `Injector` may have a parent `Injector`. During dependency
     * resolution, if a certain dependency does not exist in the current
     * `Injector`, the `Injector` looks for it in its parent. `Injector`s may be
     * chained to form a resolution chain. If the parent is `null`, the end of
     * the chain has been reached, and the dependency ultimately cannot be
     * found.
     *
     * @param parent The parent injector in the resolution hierarchy, or `null`
     *               for no parent.
     */
    constructor(parent: Injector | null);
    /**
     * Creates a new `Injector` instance.
     *
     * This injector's parent is the global injector.
     */
    constructor();
    constructor(parent?: Injector | null) {
        this.dependencies = new Map();

        if (parent === undefined)
            this.parent = Injector.GlobalInjector;
        else
            this.parent = parent;
    }

    // ----------------------------- PUBLIC METHODS ----------------------------

    /**
     * Creates a new `Injector` with this `Injector` as it's parent.
     *
     * This method is functionally identical to passing this `Injector` as
     * the argument to the `Injector` constructor.
     */
    public spawn(): Injector {
        return new Injector(this);
    }

    /**
     * Binds a `Provider` to the `Injector`. Once a provider has been bound,
     * it becomes an accessible dependency that can be injected or obtained
     * through other means.
     *
     * @param provider  The provider to bind.
     * @param args      Arguments to pass to the provider upon construction.
     *
     * @returns         `this` for method chaining.
     */
    public bind<T>(provider: Provider<T>, ...args: any[]): this {
        let token: InjectorToken<T> = provider.token;

        // Prevent double binding / re-binding of providers
        if (this.dependencies.has(token)) {
            console.warn(`WARN: Tried to double bind a provider under token ${String(token)}.\
                      Binding aborted.`);
            return this;
        }

        // Add the dependency to the dependency map
        this.dependencies.set(token, provider.create(this, args));

        return this;
    }

    /**
     * Calls a class constructor or factory function, and applies it with
     * any dependencies it needs.
     *
     * If a class is provided, the parameters defined in the constructor are
     * supplied by the injector, and the newly created instance object is
     * returned. Factory functions behave similarly, where dependencies are
     * passed to the function as arguments and whatever it returns is also
     * returned by the apply method.
     *
     * Note that, in both cases, a decorator must be present over the definition
     * for either the class or function. Without any decorators at all, the
     * `Injector` will not be able to determine what dependencies the
     * constructor or factory function requires.
     *
     * Creates a new instance of a class, injecting dependencies into the
     * constructor.
     *
     * @param fnOrConstructor   The class to create a new instance from.
     *
     * @throws                  If the required dependencies could not be
     *                          determined or could not be resolved by the
     *                          injector.
     *
     * @returns                 The new instance with dependencies injected
     *                          into it.
     */
    public apply<T>(fnOrConstructor: Type<T> | FactoryFunction<T>): T {
        let args: InjectorToken<keyof T>[] = Reflect.getMetadata(
            'design:paramtypes',
            fnOrConstructor
        );

        if (!args)
            throw new Error(`Failed to determine paramater types for ${fnOrConstructor}.`);

        let injections = this.resolve<T, keyof T>(...args);

        /**
         * If `fnOrConstructor` is a constructor, call `new` and return the new
         * instance. Otherwise, call the function.
         */
        if (fnOrConstructor.prototype) {
            let _constructor = fnOrConstructor as Type<T>;
            return new _constructor(...injections);
        } else {
            let factory = fnOrConstructor as FactoryFunction<T>;
            return factory(...injections);
        }
    }

    /**
     * Resolves one or more tokens to the dependencies they store.
     *
     * @param token The token(s) the dependency(s) is stored under.
     *
     * @throws If one or more tokens could not be resolved.
     *
     * @returns The dependency(s), or `undefined` if no dependency(s) exists.
     */
    public resolve<T, K extends keyof T>(...tokens: InjectorToken<K>[]): T[K][] {
        if ( !(tokens instanceof Array) )
            tokens = [tokens];
        return tokens.map(token => {
            // Check this injector for the dependency
            if (this.dependencies.has(token))
                return this.dependencies.get(token);
            // If not found, check the parent
            else if (this.parent)
                return this.parent.resolve<T, K>(token);
            // No parent means this is a root injector; dep cannot be resolved
            else
                throw new Error(`Unable to resolve token ${String(token)}: No dependency exists under this token.`);
        });
    }

}
