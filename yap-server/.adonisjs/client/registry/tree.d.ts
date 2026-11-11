/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  messages: {
    index: typeof routes['messages.index']
  }
  channels: {
    index: typeof routes['channels.index']
    members: typeof routes['channels.members']
    accept: typeof routes['channels.accept']
    decline: typeof routes['channels.decline']
  }
}
