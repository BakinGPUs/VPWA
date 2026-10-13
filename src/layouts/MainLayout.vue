<template>
  <q-layout v-if="store.me" view="hHh LpR fFf" class="yap-layout">
    <!-- Hlavička: názov otvoreného kanála, prihlásený používateľ, odhlásenie -->
    <q-header bordered class="yap-header">
      <q-toolbar>
        <q-btn flat round dense icon="menu" class="lt-md q-mr-sm" @click="drawerOpen = !drawerOpen" />
        <img src="/assets/logo.png" alt="YAP!" class="header-logo" />

        <q-toolbar-title class="text-subtitle1">
          <template v-if="channel">
            <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="18px" class="text-amber-5" />
            {{ channel.name }}
          </template>
        </q-toolbar-title>

        <span class="text-grey-4 q-mr-sm">@{{ store.me.nick }}</span>
        <q-btn flat round dense icon="logout" @click="onLogout">
          <q-tooltip>Odhlásiť sa</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Ľavý panel: zoznam mojich kanálov (pozvánky sú zvýraznené a hore) -->
    <q-drawer v-model="drawerOpen" show-if-above bordered :width="240" class="yap-drawer">
      <div class="drawer-title">Kanály</div>

      <q-list>
        <q-item
          v-for="item in channels"
          :key="item.id"
          clickable
          :active="item.id === store.currentChannel"
          active-class="channel-active"
          :class="{ 'channel-invited': isInvited(item.id) }"
          @click="store.currentChannel = item.id"
        >
          <q-item-section avatar class="channel-icon">
            <q-icon :name="item.type === 'private' ? 'lock' : 'tag'" size="18px" />
          </q-item-section>
          <q-item-section>{{ item.name }}</q-item-section>
          <q-item-section v-if="isInvited(item.id)" side>
            <q-badge color="amber-7" text-color="dark" label="pozvánka" />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="channels.length === 0" class="q-pa-md text-grey-6">
        Nie ste v žiadnom kanáli.
      </div>
    </q-drawer>

    <!-- Stred: správy otvoreného kanála -->
    <q-page-container>
      <q-page :style-fn="pageHeight" class="column">
        <div v-if="!channel" class="col flex flex-center text-grey-6">
          Vyberte si kanál zo zoznamu.
        </div>

        <div v-else-if="isInvited(channel.id)" class="col flex flex-center">
          <div class="invite-card text-center">
            <div class="text-h6">Pozvánka do #{{ channel.name }}</div>
            <div class="text-grey-5 q-mb-md">Správca: @{{ getUser(channel.admin).nick }}</div>
            <q-btn unelevated no-caps class="btn-yap q-mr-sm" label="Prijať" @click="acceptInvite(channel.id)" />
            <q-btn flat no-caps color="grey-5" label="Odmietnuť" @click="declineInvite(channel.id)" />
          </div>
        </div>

        <div v-else ref="scrollBox" class="col scroll q-px-md">
          <!-- reverse = načítava staršie správy, keď používateľ doscrolluje hore -->
          <q-infinite-scroll reverse :key="channel.id" @load="loadOlder">
            <template #loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="amber-5" size="32px" />
              </div>
            </template>

            <div
              v-for="message in visibleMessages"
              :key="message.id"
              class="message"
              :class="{ 'message-mention': isMentioned(message) }"
            >
              <span class="message-nick" :class="{ 'text-amber-5': message.user === store.me.id }">
                {{ getUser(message.user).nick }}
              </span>
              <span class="message-time">{{ formatTime(message.time) }}</span>
              <div>{{ message.text }}</div>
            </div>
          </q-infinite-scroll>
        </div>
      </q-page>
    </q-page-container>

    <!-- Príkazový riadok – vždy viditeľný -->
    <q-footer bordered class="yap-footer">
      <q-input
        v-model="text"
        outlined
        dense
        autofocus
        color="amber-7"
        class="input-field"
        placeholder="Napíšte správu alebo /príkaz"
        @keyup.enter="submit"
      >
        <template #append>
          <q-btn flat round dense icon="send" color="amber-5" @click="submit" />
        </template>
      </q-input>
    </q-footer>
  </q-layout>
</template>

<script>
import {
  store, getUser, myChannels, isInvited, isMentioned, channelMessages,
  sendMessage, acceptInvite, declineInvite, logout
} from 'src/store'

const PAGE_SIZE = 20 // koľko správ sa načíta naraz

export default {
  data () {
    return {
      store,
      drawerOpen: false,
      text: '',
      count: PAGE_SIZE // koľko posledných správ je zobrazených
    }
  },
  computed: {
    channels () {
      return myChannels()
    },
    channel () {
      return this.channels.find(channel => channel.id === store.currentChannel)
    },
    messages () {
      return channelMessages(store.currentChannel)
    },
    visibleMessages () {
      return this.messages.slice(-this.count)
    }
  },
  watch: {
    'store.currentChannel' () {
      this.count = PAGE_SIZE
    },
    'messages.length' () {
      this.scrollToBottom()
    }
  },
  created () {
    // po prihlásení otvoríme prvý kanál, v ktorom som členom
    if (!store.currentChannel) {
      const first = this.channels.find(channel => !isInvited(channel.id))
      if (first) store.currentChannel = first.id
    }
  },
  methods: {
    getUser,
    isInvited,
    isMentioned,
    acceptInvite,
    declineInvite,

    pageHeight (offset, height) {
      return { height: (height - offset) + 'px' }
    },

    // Volá q-infinite-scroll. Timeout napodobňuje načítavanie zo servera.
    loadOlder (index, done) {
      const channelId = store.currentChannel
      setTimeout(() => {
        if (channelId !== store.currentChannel) return // medzitým sa prepol kanál
        this.count += PAGE_SIZE
        done(this.count >= this.messages.length) // true = už nie je čo načítať
      }, 400)
    },

    submit () {
      const text = this.text.trim()
      if (!text) return

      if (text.startsWith('/')) {
        return this.$q.notify({ message: 'Neznámy príkaz: ' + text.split(' ')[0], color: 'negative' })
      }

      const error = sendMessage(text)
      if (error) return this.$q.notify({ message: error, color: 'negative' })
      this.text = ''
    },

    scrollToBottom () {
      this.$nextTick(() => {
        const box = this.$refs.scrollBox
        if (box) box.scrollTop = box.scrollHeight
      })
    },

    formatTime (time) {
      return new Date(time).toLocaleString('sk-SK', {
        day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    },

    async onLogout () {
      // najprv odísť zo stránky, až potom zmazať používateľa (inak by sa layout prekreslil bez store.me)
      await this.$router.push('/login')
      logout()
    }
  }
}
</script>

<style scoped>
.yap-layout {
  background: #14171d;
  color: #f1f5f9;
}

.yap-header,
.yap-footer {
  background: #1c2028;
  border-color: rgba(251, 191, 36, 0.22) !important;
}

.yap-footer {
  padding: 8px 12px;
}

.header-logo {
  height: 32px;
  margin-right: 8px;
}

.yap-drawer {
  background: #1c2028;
}

.drawer-title {
  padding: 16px 16px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.channel-icon {
  min-width: 32px;
}

.channel-active {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.channel-invited {
  background: rgba(251, 191, 36, 0.25);
  font-weight: 700;
}

.invite-card {
  background: #1c2028;
  border: 1px solid rgba(251, 191, 36, 0.22);
  border-radius: 20px;
  padding: 28px 32px;
}

.message {
  padding: 6px 10px;
  margin: 2px 0;
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.message-mention {
  background: rgba(251, 191, 36, 0.1);
  border-left-color: #fbbf24;
}

.message-nick {
  font-weight: 700;
  margin-right: 8px;
}

.message-time {
  font-size: 11px;
  color: #64748b;
}

.input-field :deep(.q-field__control) {
  border-radius: 12px;
  background-color: #161920;
}

.btn-yap {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
  color: #12151b !important;
  font-weight: 800;
  border-radius: 12px;
}
</style>
