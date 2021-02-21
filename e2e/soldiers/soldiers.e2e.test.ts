
import { ClassProvider, Inject, Injectable, Injector, Provider } from '../../src';

test('Equipt a soldier for battle', () => {
    // Create a new Injector
    const injector: Injector = new Injector();

    @Injectable()
    class Armor {
        private protection = 5;

        constructor () { /* Empty */ }

        public getProtection (): number {
            return this.protection;
        }
    }

    // Bind Armor to the Injector
    const armorProvider: Provider<Armor> = new ClassProvider(Armor, true);

    injector.bind<Armor>(armorProvider);

    interface Projectile {
    damage: number;
  }


    @Injectable()
    class Bullet implements Projectile {
        public damage: number;

        constructor () {
            this.damage = 10;
        }
    }

    /*   @Injectable()
  class ExplosiveBullet implements Projectile {
    public damage: number;

    constructor() {
      this.damage = 20;
    }
  } */

    // Create providers for the projectiles
    const bulletProvider: Provider<Bullet> = new ClassProvider(Bullet, true);

    // Bind them to the Injector
    injector.bind<Bullet>(bulletProvider);


    interface Weapon {
    getAttackDamage: () => number;
  }

    @Injectable()
    class Sword implements Weapon {

        damage: number;

        constructor () {
            this.damage = 15;
        }

        public getAttackDamage (): number {
            return this.damage;
        }
    }

    @Injectable()
    class Musket implements Weapon {

        private projectile: Projectile;

        private clipSize: number;

        constructor (projectile: Bullet) {
            this.projectile = projectile;
            this.clipSize = 10;
        }

        public getAttackDamage (): number {
            if (this.clipSize > 0) {
                this.clipSize--;

                return this.projectile.damage;
            }

            return 0;

        }

        public bulletsLeft (): number {
            return this.clipSize;
        }
    }

    // Create Providers for the weapons
    const musketProvider: Provider<Musket> = new ClassProvider(Musket, true, 'primary');
    const swordProvider: Provider<Sword> = new ClassProvider(Sword, true, 'secondary');

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
        @Inject({ providedIn: injector,
            token:      'primary' }) primary!: Weapon;

        // Give our soldier a secondary weapon
        @Inject({ providedIn: injector,
            token:      'secondary' }) secondary!: Weapon;

        constructor () {
            this.health = 100;
            this.isAlive = true;
        }

        public takeDamage (dmg: number): boolean {
            if (dmg > this.armor.getProtection()) {
                this.health -= dmg - this.armor.getProtection();
            }
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }

            return this.isAlive;
        }

        public attack (enemy: Soldier): boolean {
            return enemy.takeDamage(this.primary.getAttackDamage());
        }

        public secondAttack (enemy: Soldier): boolean {
            return enemy.takeDamage(this.secondary.getAttackDamage());
        }
    }

    // Lets do some injection!

    const johnWick: Soldier = new Soldier();
    const chuckNorris: Soldier = new Soldier();

    expect(chuckNorris.secondary).toBeDefined();
    expect(chuckNorris.secondary.getAttackDamage()).toBe(15);

    johnWick.attack(chuckNorris);
    expect(chuckNorris.health).toBe(95);
    expect((<Musket>chuckNorris.primary).bulletsLeft()).toBe(9);
});
