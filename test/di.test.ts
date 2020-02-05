/**
 * Integration Tests
 *
 * @author Donald Isaac
 * @license MIT
 */
import { Injector, Inject, Injectable, Provider, ClassProvider } from '../src/';
import 'reflect-metadata';

/**
 * ==== TEST ====
 */
test('Injector properly binds to a ClassProvider', () => {

  let injector: Injector = Injector.GlobalInjector;

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


  @Inject({ providedIn: injector })
  class Receiver {
    constructor(public dep: Dependency) { }
  }
  //
  // test code

  let provider: Provider<Dependency> = new ClassProvider(Dependency);
  injector.bind(provider);
  let result: Receiver = injector.apply<Receiver>(Receiver);

  expect(result).toBeDefined();
  expect(result.dep).toBeDefined();
  expect(result.dep.prop).toEqual('Dependency property');
  let foo = result.dep.foo();
  expect(foo).toEqual('Foo called, prop: Dependency property');
}); // end test

/**
 * ==== TEST ====
 */
test('Inject property decorator injects expected value', () => {
  let injector: Injector = Injector.GlobalInjector;

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

  let provider: Provider<Dependency> = new ClassProvider(Dependency);
  injector.bind<Dependency>(provider);

  class Receiver {
    @Inject({ providedIn: injector })
    public dep!: Dependency;

    constructor() {
      // empty
    }
  }

  let target = new Receiver();
  expect(target.dep).toBeDefined();
  expect<string>(target.dep.foo()).toEqual('Foo called, prop: Dependency property');
}); // end test

test('Equipt a soldier for battle', function () {
  // Create a new Injector
  let injector: Injector = new Injector();
  @Injectable()
  class Armor {
    private protection: number = 5;

    constructor() { /* empty */ }

    public getProtection(): number {
      return this.protection;
    }
  }

  // Bind Armor to the Injector
  let armorProvider: Provider<Armor> = new ClassProvider(Armor);
  injector.bind<Armor>(armorProvider);

  interface Projectile {
    damage: number;
  }



  @Injectable()
  class Bullet implements Projectile {
    public damage: number;

    constructor() {
      this.damage = 10;
    }
  }

  @Injectable()
  class ExplosiveBullet implements Projectile {
    public damage: number;

    constructor() {
      this.damage = 20;
    }
  }

  // Create providers for the projectiles
  let bulletProvider: Provider<Bullet> = new ClassProvider(Bullet);

  // Bind them to the Injector
  injector.bind<Bullet>(bulletProvider);


  interface Weapon {
    getAttackDamage: () => number;
  }

  @Injectable()
  class Sword implements Weapon {

    damage: number;

    constructor() {
      this.damage = 15;
    }

    public getAttackDamage(): number {
      return this.damage;
    }
  }

  @Injectable()
  class Musket implements Weapon {

    private projectile: Projectile;
    private clipSize: number;

    constructor(projectile: Bullet) {
      this.projectile = projectile;
      this.clipSize = 10;
    }

    public getAttackDamage(): number {
      if (this.clipSize > 0) {
        this.clipSize--;
        return this.projectile.damage;
      } else {
        return 0;
      }
    }

    public bulletsLeft(): number {
      return this.clipSize;
    }
  }

  // Create Providers for the weapons
  let musketProvider: Provider<Musket> = new ClassProvider(Musket, 'primary');
  let swordProvider: Provider<Sword>   = new ClassProvider(Sword, 'secondary');

  // Bind the providers to the Injector
  injector.bind<Weapon>(swordProvider).bind<Weapon>(musketProvider);

  /**
   * All properties marked with `@Inject()` will be resolved automatically
   * by the Injector.
   */
  class Soldier {
    health: number;
    isAlive: boolean;

    // In this case, the Armor constructor function acts as the token
    @Inject({ providedIn: injector }) armor!: Armor;
    // Injector will inject a Weapon into the Solder class automatically
    @Inject({ providedIn: injector, token: 'primary' }) primary!: Weapon;
    // Give our soldier a secondary weapon
    @Inject({ providedIn: injector, token: 'secondary' }) secondary!: Weapon;

    constructor() {
      this.health = 100;
      this.isAlive = true;
    }

    public takeDamage(dmg: number): boolean {
      if (dmg > this.armor.getProtection())
        this.health -= dmg - this.armor.getProtection();
      if (this.health <= 0) {
        this.health = 0;
        this.isAlive = false;
      }

      return this.isAlive;
    }
    public attack(enemy: Soldier): boolean {
      return enemy.takeDamage(this.primary.getAttackDamage());
    }

    public secondAttack(enemy: Soldier): boolean {
      return enemy.takeDamage(this.secondary.getAttackDamage());
    }
  }

  // Lets do some injection!

  let johnWick: Soldier    = new Soldier();
  let chuckNorris: Soldier = new Soldier();

  expect(chuckNorris.secondary).toBeDefined();
  expect(chuckNorris.secondary.getAttackDamage()).toBe(15);

  johnWick.attack(chuckNorris);
  expect(chuckNorris.health).toBe(95);
  expect((<Musket>chuckNorris.primary).bulletsLeft()).toBe(9);
});
