import { Injector } from '..';
import { FactoryProvider, ObjectProvider } from '../injector';

describe('Providers', () => {
    let injector: Injector


    describe('ClassProvider', () => {

    })

    describe('ObjectProvider', () => {

        const dep = { foo: 'foo', bar: 4 }
        const token = 'OBJECT_TOKEN'
        let provider: ObjectProvider<typeof dep>

        beforeAll(() => {
            injector = new Injector()
        })
        beforeEach(() => {
            provider = new ObjectProvider(dep, token)
        })

        it('get() returns the bound object', () => {
            expect(provider.get()).toBe(dep)
        })

        it('get() returns references to the same object', () => {
            expect(provider.get()).toBe(provider.get())
        })

        it('Injector token is set properly', () => {
            expect(provider.token).toBe(token)
        })

        describe('When an ObjectProvider is bound to an injector', () => {
            beforeAll(() => {
                injector.bind(new ObjectProvider(dep, token))
            })

            it('Provides the specified object', () => {
                // injector.bind(new ObjectProvider(dep, token))
                let [actual] = injector.resolve(token)
                expect(actual).toBe(dep)
            })
        })
    }) // !ObjectProvider

    describe('FactoryProvider', () => {

        let fn = jest.fn()
        const ret = { foo: 'foo', bar: 4 }
        const token = 'FN_TOKEN'

        beforeAll(() => {
            injector = new Injector()
            fn.mockReturnValueOnce(ret)
        })

        describe('get() for singleton providers', () => {
            let provided: any
            let provider: FactoryProvider<any>

            beforeAll(() => {
                provider = new FactoryProvider(fn, true, token)
                provided = provider.get(injector)
            })

            it('Calls the factory function', () => {
                expect(fn).toBeCalled()
            })

            it('Provides what the factory function produces', () => {
                expect(provided).toBe(ret)
            })

            it('Caches the result, returning it on following invocations', () => {
                let nextProvided = provider.get(injector)
                expect(nextProvided).toBe(provided)
                expect(fn).toBeCalledTimes(1)
            })
        })

        beforeEach(() => {
            // provider = new FactoryProvider()
        })
    })
})
