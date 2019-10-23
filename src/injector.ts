import { InjectorToken, Type, FactoryFunction } from './di';

/**
 * A Provider is used to deliver a dependency to the Injector
 */
export interface Provider<T> {

    /**
     * The Injector Token the dependency will be stored under once the `Provider`
     * is bound to an `Injector`
     */
    token: InjectorToken<T>;

    /**
     * Creates a new instance of the dependency. If no arguments are passed,
     * and the provider used requires arguments (ex: providing a factory that
     * takes arguments), the `Injector` attempts to resolve the arguments.
     *
     * @param injector  The injector the provider is being bound to
     * @param args      Optional arguments to pass during dependency construction
     *
     * @returns a new instance of the dependency
     */
    create(injector: Injector, ...args: any[]): T;
}

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
    private dependencies: Map<InjectorToken<any>, any>;

    private parent: Injector | null;

    constructor(parent?: Injector | null) {
        this.dependencies = new Map();

        if (parent === undefined)
            this.parent = GlobalInjector;
        else
            this.parent = parent;
    }

    /**
     * Creates a new `Injector` with this `Injector` as it's parent.
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
     * Creates a new instance of a class, injecting dependencies into the
     * constructor.
     *
     * @param fnOrConstructor   The class to create a new instance from
     *
     * @returns       The new instance with dependencies injected into it.
     */
    public apply<T>(fnOrConstructor: Type<T> | FactoryFunction<T>): T {
        let args: InjectorToken<keyof T>[] = Reflect.getMetadata('design:paramtypes', fnOrConstructor);

        if (!args)
            throw new Error(`Failed to resolve ${fnOrConstructor}: Unable to determine param types.`);

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
     * @returns The dependency(s), or `undefined` if no dependency(s) exists.
     */
    public resolve<T, K extends keyof T>(...tokens: InjectorToken<K>[]): T[K][] {

        return tokens.map(token => {
            if (this.dependencies.has(token))
                return this.dependencies.get(token);
            else {
                if (!this.parent)
                    throw new Error(`Unable to resolve token ${String(token)}: No dependency exists under this token.`);
                else
                    return this.parent.resolve<T, K>(token);
            }
        });
    }
}

export const GlobalInjector = new Injector(null);
