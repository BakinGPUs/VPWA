import { ChannelSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import ChannelMember from '#models/channel_member'
import Message from '#models/message'
import KickVote from '#models/kick_vote'

export default class Channel extends ChannelSchema {
  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>

  @hasMany(() => ChannelMember)
  declare members: HasMany<typeof ChannelMember>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @hasMany(() => KickVote)
  declare kickVotes: HasMany<typeof KickVote>

  //kanal bez novej spravy viac ako 30 dni zanika
  static async deleteExpired() {
    const limit = DateTime.now().minus({ days: 30 })
    await Channel.query().where('lastMessageAt', '<', limit.toFormat('yyyy-MM-dd HH:mm:ss')).delete()
  }
}
