/**
 * Integration Tests
 *
 * @author Donald Isaac
 * @license MIT
 */
import { ClassProvider, Inject, Injectable, Injector, Provider } from '..';
import { SINGLETON_SYMBOL, Singleton } from '../decorators';

/**
 * ==== TEST ====
 */
test(
    'Injector properly binds to a ClassProvider',
    () => {

        const injector: Injector = Injector.GlobalInjector;

        @Injectable()
        class Dependency {

            public prop: string;

            constructor() {
                this.prop = 'Dependency property';
            }

            foo(): string {

                return `Foo called, prop: ${this.prop}`;

            }

        }


        @Inject()
        class Receiver {

            constructor(public dep: Dependency) { }

        }

        /*
         *
         * Test code
         */

        const provider: Provider<Dependency> = new ClassProvider(
            Dependency,
            false
        );

        injector.bind(provider);
        const result: Receiver = injector.apply<Receiver>(Receiver);

        expect(result).toBeDefined();
        expect(result.dep).toBeDefined();
        expect(result.dep.prop).toEqual('Dependency property');
        const foo = result.dep.foo();

        expect(foo).toEqual('Foo called, prop: Dependency property');

    }
); // End test

/**
 * ==== TEST ====
 */
test(
    'Injector properly injects a ObjectProvider',
    () => {

        const MY_NUM = 6;
        // Const SECOND_NUM = 7;

        Injector.GlobalInjector.bind<number>({
            'key': 'MY_NUM',
            'provideConstant': MY_NUM
        });

        class Receiver {

            @Inject('MY_NUM')
            num!: number;

            constructor() { /* */ }

            public addNum(a: number): number {

                return this.num + a;

            }

        }

        const rec = new Receiver();

        expect(rec.num).toBe(MY_NUM);
        expect(rec.addNum(5)).toBe(5 + MY_NUM);

    }
);

/**
 * ==== TEST ====
 */
test(
    'Inject property decorator injects expected value',
    () => {

        const injector: Injector = Injector.GlobalInjector;

        @Injectable()
        class Dependency {

            public prop: string;

            constructor() {

                this.prop = 'Dependency property';

            }

            foo(): string {

                return `Foo called, prop: ${this.prop}`;

            }

        }

        const provider: Provider<Dependency> = new ClassProvider(
            Dependency,
            true
        );

        injector.bind<Dependency>(provider);

        class Receiver {

            @Inject({ 'providedIn': injector })
            public dep!: Dependency;

            constructor() {
                // Empty
            }

        }

        const target = new Receiver();

        expect(target.dep).toBeDefined();
        expect<string>(target.dep.foo()).toEqual('Foo called, prop: Dependency property');

    }
); // End test

test(
    'Singleton dependencies are only created once',
    () => {

        // Let aCount: number = 0;

        @Injectable()
        @Singleton
        class A {

            static count = 0;

            constructor() {

                A.count++;

            }

        }

        @Inject()
        class B {

            static count = 0;

            constructor(public a: A) {

                B.count++;

            }

        }

        @Inject()
        class C {

            constructor(public b: B) { }

        }

        Injector.GlobalInjector.
            bind(A).
            bind(B).
            bind(C);

        const one: C = Injector.GlobalInjector.apply(C),
            two: C = Injector.GlobalInjector.apply(C),
            three: C = Injector.GlobalInjector.apply(C);

        expect(Reflect.getMetadata(
            SINGLETON_SYMBOL,
            A
        )).toBeTruthy();
        expect(one?.b?.a).toBeTruthy();
        expect(A.count).toEqual(1);
        expect(B.count).toEqual(3);
        // A is a singleton, so they should be the same object
        expect(one.b.a).toBe(two.b.a);
        expect(one.b.a).toBe(three.b.a);
        // B is not a singleton, so they should not be the same object
        expect(one.b).not.toBe(two.b);
        expect(one.b).not.toBe(three.b);

    }
);
