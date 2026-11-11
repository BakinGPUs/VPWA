import { KickVoteSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Channel from '#models/channel'

export default class KickVote extends KickVoteSchema {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  //koho kickuju
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  //kto hlasoval
  @belongsTo(() => User, { foreignKey: 'voterId' })
  declare voter: BelongsTo<typeof User>
}
