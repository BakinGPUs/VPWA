import { BaseTransformer } from '@adonisjs/core/transformers'
import Message from '#models/message'

export default class MessageTransformer extends BaseTransformer<Message> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'channelId', 'userId', 'text', 'createdAt']),
      nick: this.resource.author?.nick,
    }
  }
}
