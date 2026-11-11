export interface AppSocket {

  readonly channels: {

    readonly 'users/:id': {

      readonly params: {

        readonly 'id': string | number

      }

      readonly channel: typeof import('#channels/user_channel').default

      readonly handlers: {

      }

    }

  }

}

