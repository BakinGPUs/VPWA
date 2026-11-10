import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

//rovnake testovacie data ako v yap-client/src/store.js, heslo je vsade heslo123
export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      { firstName: 'Jozef', lastName: 'Mrkvička', fullName: 'Jozef Mrkvička', nick: 'jozko', email: 'jozko@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Eduard', lastName: 'Kováč', fullName: 'Eduard Kováč', nick: 'peterbondra', email: 'ed@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Lucia', lastName: 'Horváthová', fullName: 'Lucia Horváthová', nick: 'lucia', email: 'lucia@stuba.sk', password: 'heslo123', status: 'dnd' },
      { firstName: 'Marek', lastName: 'Baláž', fullName: 'Marek Baláž', nick: 'ludovahudbastanabalaza', email: 'marek@stuba.sk', password: 'heslo123', status: 'online' },
      { firstName: 'Peter', lastName: 'Šimko', fullName: 'Peter Šimko', nick: 'peto', email: 'peto@stuba.sk', password: 'heslo123', status: 'offline' },
      { firstName: 'Tomáš', lastName: 'Rypal', fullName: 'Tomáš Rypal', nick: 'trollko', email: 'trollko@stuba.sk', password: 'heslo123', status: 'online' },
    ])
  }
}
