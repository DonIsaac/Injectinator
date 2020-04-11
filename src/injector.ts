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
     * Gets the dependency.
     *
     * If this dependency is a singleton, and has not yet been accessed,
     * a new instance of the dependency will be created. This allows for
     * lazy loading and a better user experience.
     *
     * If this dependency is not a singleton, a new intance will be created
     * each time.
     *
     * @param injector  The injector the provider is being bound to
     *
     * @returns a new instance of the dependency
     */
    get(injector: Injector): T;
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

    private instance?: T;
    public token: InjectorToken<T>;

    constructor(private clazz: Type<T>, private isSingleton: boolean, token?: InjectorToken<T>) {
        if (token)
            this.token = token;
        else
            this.token = clazz;
    }

    public get(injector: Injector): T {
        if (this.isSingleton) {
            if (!this.instance) {
                this.instance = injector.apply<T>(this.clazz);
            }
            return this.instance;

        } else {
            // return new this.clazz(args);
            return injector.apply<T>(this.clazz);
        }
    }
}

export class ObjectProvider<T> implements Provider<T> {

    constructor(private obj: T, public token: InjectorToken<T>) { }

    public get(injector: Injector): T {
        return this.obj;
    }
}

export class FactoryProvider<T> implements Provider<T> {

    private instance?: T;

    constructor(private factory: FactoryFunction<T>, private isSingleton: boolean, public token: InjectorToken<T>) { }

    public get(injector: Injector): T {

        if (this.isSingleton) {
            if (!this.instance) {
                this.instance = injector.apply(this.factory);
            }
            return this.instance;

        } else {
            return injector.apply(this.factory);
        }
    }
}

export interface ProviderOptions<T> {
  /** Token the provider will be provided under. */
  key: InjectorToken<T>;

  /** Provide a class */
  provide?: Type<T>;

  /** Provide a function */
  provideFactory?: FactoryFunction<T>;

  /** Provide an object */
  provideConstant?: T;

  /**
   * Whether or not this dependency should be a singleton. defaults to false.
   *
   * Note that this option only applies to classes and factories. Constants are
   * never singleltons. Setting this option will not change how constants are provided.
   *
   * If this is true, a single instance will be created
   * the first time a dependent accesses it. All dependents will use the same
   * instance of the dependency.
   *
   * If this is false, or if this flag is not set, a new instance of the
   * dependency will be created each time it is injected into a dependent.
   */
  singleton?: boolean;
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
    private dependencies: Map<InjectorToken<any>, Provider<any>>;
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

    public bind<T>(options: ProviderOptions<T>): this;

    /**
     * Binds a `Provider` to the `Injector`. Once a provider has been bound,
     * it becomes an accessible dependency that can be injected or obtained
     * through other means.
     *
     * @param provider  The provider to bind.
     *
     * @returns         `this` for method chaining.
     */
    public bind<T>(provider: Provider<T>): this;
    public bind<T>(provider: Type<T>): this;
    public bind<T>(options: ProviderOptions<T>): this;
    public bind<T>(dto: ProviderOptions<T> | Provider<T> | Type<T>): this {
        let provider: Provider<T>;

        if (dto == null) {
            throw new Error('Provider value is null');
        }


        if((dto as Provider<T>).get && (dto as Provider<T>).token) {     // dto is a Provider
            provider = dto as Provider<T>;

        } else {
            if ((dto as ProviderOptions<T>).provide) {                      // dto specifies a class provider
                let { key, provide, singleton = false } = dto as ProviderOptions<T>;
                // @ts-ignore
                provider = new ClassProvider<T>(provide, singleton, key);

            } else if ((dto as ProviderOptions<T>).provideFactory != null) { // dto specifies a factory provider
                let { key, provideFactory, singleton = false } = dto as ProviderOptions<T>;
                // @ts-ignore
                provider = new FactoryProvider<T>(provideFactory, singleton, key);

            } else if ((dto as ProviderOptions<T>).provideConstant) {        // dto specifies a const provider
                let { key, provideConstant } = dto as ProviderOptions<T>;
                // @ts-ignore
                provider = new ObjectProvider<T>(provideConstant, key);

            } else {                                                        // class provider again
                provider = new ClassProvider(dto as Type<T>, false);
            }
        }

        return this._bind<T>(provider);
    }

    /**
     * Binds a `Provider` to the `Injector`. Once a provider has been bound,
     * it becomes an accessible dependency that can be injected or obtained
     * through other means.
     *
     * @param provider  The provider to bind.
     *
     * @returns         `this` for method chaining.
     */
    private _bind<T>(provider: Provider<T>): this {
        let token: InjectorToken<T> = provider.token;

        // Prevent double binding / re-binding of providers
        if (this.dependencies.has(token)) {
            console.warn(`WARN: Tried to double bind a provider under token ${String(token)}.\
                      Binding aborted.`);
            return this;
        }

        // Add the dependency to the dependency map
        this.dependencies.set(token, provider);

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
                return this.dependencies.get(token)!.get(this);
            // If not found, check the parent
            else if (this.parent)
                return this.parent.resolve<T, K>(token);
            // No parent means this is a root injector; dep cannot be resolved
            else
                throw new Error(`Unable to resolve token ${String(token)}: No dependency exists under this token.`);
        });
    }

}
