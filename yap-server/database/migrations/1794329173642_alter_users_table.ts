import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nick', 30).nullable().unique()
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      //online / dnd / offline
      table.string('status', 10).notNullable().defaultTo('online')
      table.boolean('notify_only_mentions').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['nick'])
      table.dropColumn('nick')
      table.dropColumn('first_name')
      table.dropColumn('last_name')
      table.dropColumn('status')
      table.dropColumn('notify_only_mentions')
    })
  }
}
