<template>
  <q-layout v-if="store.me" view="hHh LpR fFf" class="yap-layout">
    <!-- Hlavička -->
    <q-header bordered class="yap-header">
      <q-toolbar>
        <q-btn flat round dense icon="menu" class="q-mr-sm" @click="leftDrawerOpen = !leftDrawerOpen">
          <q-tooltip>Zoznam kanálov</q-tooltip>
        </q-btn>
        <img src="/assets/logo.png" alt="YAP!" class="header-logo" />

        <q-toolbar-title class="text-subtitle1 row items-center no-wrap">
          <template v-if="channel">
            <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="18px" class="text-amber-5 q-mr-xs" />
            <span class="ellipsis">{{ channel.name }}</span>
            <q-badge v-if="channel.admin === store.me.id" color="amber-8" text-color="dark" class="q-ml-sm" label="správca" />
          </template>
        </q-toolbar-title>

        <q-btn
          v-if="channel && !channel.invited"
          flat
          dense
          no-caps
          icon="group"
          :label="membersCountText"
          class="q-mr-sm"
          @click="rightDrawerOpen = !rightDrawerOpen"
        >
          <q-tooltip>Zoznam členov kanála (/list)</q-tooltip>
        </q-btn>

        <span class="text-grey-4 q-mr-sm text-caption">@{{ store.me.nick }}</span>
        <q-btn flat round dense icon="logout" @click="onLogout">
          <q-tooltip>Odhlásiť sa</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Ľavý panel: Zoznam kanálov & správa kanálov -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260" class="yap-drawer column justify-between">
      <div>
        <div class="row items-center justify-between q-pa-sm">
          <div class="drawer-title">Kanály</div>
          <q-btn
            dense
            flat
            color="amber-5"
            icon="add"
            label="Nový"
            no-caps
            size="sm"
            class="q-px-sm"
            @click="showCreateDialog = true"
          >
            <q-tooltip>Vytvoriť kanál (/join)</q-tooltip>
          </q-btn>
        </div>

        <q-list class="q-px-xs">
          <q-item
            v-for="item in channels"
            :key="item.id"
            clickable
            :active="item.id === store.currentChannel"
            active-class="channel-active"
            :class="{ 'channel-invited': isInvited(item.id) }"
            class="channel-item rounded-borders"
            @click="store.currentChannel = item.id"
          >
            <q-item-section avatar class="channel-icon">
              <q-icon :name="item.type === 'private' ? 'lock' : 'tag'" size="18px" />
            </q-item-section>
            <q-item-section class="ellipsis">
              {{ item.name }}
            </q-item-section>
            <q-item-section v-if="isInvited(item.id)" side>
              <q-badge color="amber-7" text-color="dark" label="pozvánka" />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="channels.length === 0" class="q-pa-md text-grey-6 text-caption text-center">
          Nie ste členom žiadneho kanála. Vytvorte si nový pomocou tlačidla vyššie alebo napíšte <code>/join nazov</code>.
        </div>
      </div>

      <!-- Spodná lišta ľavého panelu: akcie pre aktuálne zvolený kanál -->
      <div v-if="channel && !channel.invited" class="channel-actions q-pa-sm">
        <div class="text-caption text-grey-5 q-mb-xs ellipsis">Vybraný kanál: #{{ channel.name }}</div>
        <div class="row q-gutter-xs">
          <q-btn
            size="sm"
            flat
            no-caps
            color="grey-4"
            icon="exit_to_app"
            label="Opustiť"
            class="col"
            @click="confirmLeave"
          >
            <q-tooltip>Zrušiť členstvo (/cancel)</q-tooltip>
          </q-btn>
          <q-btn
            v-if="channel.admin === store.me.id"
            size="sm"
            flat
            no-caps
            color="negative"
            icon="delete"
            label="Zrušiť"
            class="col"
            @click="confirmDelete"
          >
            <q-tooltip>Zrušiť kanál pre všetkých (/quit)</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-drawer>

    <!-- Pravý panel: Zoznam členov kanála (/list) -->
    <q-drawer v-model="rightDrawerOpen" side="right" bordered :width="240" class="yap-drawer">
      <div class="row items-center justify-between q-pa-sm">
        <div class="drawer-title">Členovia kanála</div>
        <q-btn flat round dense icon="close" size="sm" @click="rightDrawerOpen = false" />
      </div>

      <q-list dense class="q-px-xs">
        <q-item v-for="member in currentMembers" :key="member.user" class="rounded-borders q-my-xs">
          <q-item-section avatar style="min-width: 32px">
            <q-icon
              name="circle"
              size="10px"
              :class="statusColorClass(getUser(member.user)?.status)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-body2">
              {{ getUser(member.user)?.nick }}
            </q-item-label>
            <q-item-label caption class="text-grey-5">
              {{ getUser(member.user)?.firstName }} {{ getUser(member.user)?.lastName }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="channel && member.user === channel.admin"
              color="amber-8"
              text-color="dark"
              label="správca"
              class="text-bold"
            />
            <q-badge
              v-else-if="member.state === 'invited'"
              color="grey-7"
              label="pozvaný"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <div class="q-pa-sm text-caption text-grey-6 text-center">
        Tip: Príkazom <code>/invite nick</code> pozvete používateľa do tohto kanála.
      </div>
    </q-drawer>

    <!-- Hlavné okno so správami -->
    <q-page-container>
      <q-page :style-fn="pageHeight" class="column">
        <div v-if="!channel" class="col flex flex-center text-grey-6 text-center q-pa-md">
          <div>
            <div class="text-h6 q-mb-xs">Žiadny otvorený kanál</div>
            <div>Vyberte si kanál v zozname alebo napíšte do príkazového riadka <code>/join nazov</code>.</div>
          </div>
        </div>

        <div v-else-if="isInvited(channel.id)" class="col flex flex-center">
          <div class="invite-card text-center">
            <div class="text-h6">Pozvánka do #{{ channel.name }}</div>
            <div class="text-grey-5 q-mb-md">
              Správca: @{{ getUser(channel.admin)?.nick }} ({{ channel.type === 'private' ? 'Súkromný' : 'Verejný' }})
            </div>
            <q-btn unelevated no-caps class="btn-yap q-mr-sm" label="Prijať pozvánku" @click="acceptInvite(channel.id)" />
            <q-btn flat no-caps color="grey-5" label="Odmietnuť" @click="declineInvite(channel.id)" />
          </div>
        </div>

        <div v-else ref="scrollBox" class="col scroll q-px-md">
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
                {{ getUser(message.user)?.nick }}
              </span>
              <span class="message-time">{{ formatTime(message.time) }}</span>
              <div>{{ message.text }}</div>
            </div>
          </q-infinite-scroll>
        </div>
      </q-page>
    </q-page-container>

    <!-- Fixný príkazový riadok -->
    <q-footer bordered class="yap-footer">
      <q-input
        v-model="text"
        outlined
        dense
        autofocus
        color="amber-7"
        class="input-field"
        placeholder="Napíšte správu alebo príkaz (/join, /invite, /kick, /list, /cancel, /quit)"
        @keyup.enter="submit"
      >
        <template #append>
          <q-btn flat round dense icon="send" color="amber-5" @click="submit">
            <q-tooltip>Odoslať správu / vykonať príkaz</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </q-footer>

    <!-- Dialóg na vytvorenie nového kanála -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="bg-grey-9 text-white" style="min-width: 320px; border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.22)">
        <q-card-section>
          <div class="text-h6">Nový kanál</div>
          <div class="text-caption text-grey-4">Vytvorenie kanála cez používateľské rozhranie</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newChannelName"
            label="Názov kanála"
            dark
            outlined
            dense
            color="amber-7"
            autofocus
            class="q-mb-md"
            @keyup.enter="handleCreateChannel"
          />
          <q-toggle
            v-model="newChannelIsPrivate"
            label="Súkromný kanál (private)"
            color="amber-7"
            dark
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Zrušiť" color="grey-4" no-caps v-close-popup />
          <q-btn unelevated class="btn-yap" label="Vytvoriť" no-caps @click="handleCreateChannel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import {
  store, getUser, myChannels, isInvited, isMentioned, channelMessages, channelMembers,
  sendMessage, acceptInvite, declineInvite, leaveChannel, deleteChannel,
  createChannel, executeCommand, logout
} from 'src/store'

const PAGE_SIZE = 20

export default {
  data () {
    return {
      store,
      leftDrawerOpen: false,
      rightDrawerOpen: false,
      text: '',
      count: PAGE_SIZE,
      showCreateDialog: false,
      newChannelName: '',
      newChannelIsPrivate: false
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
    },
    currentMembers () {
      return store.currentChannel ? channelMembers(store.currentChannel) : []
    },
    membersCountText () {
      return `${this.currentMembers.length} ${this.currentMembers.length === 1 ? 'člen' : (this.currentMembers.length < 5 ? 'členovia' : 'členov')}`
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

    statusColorClass (status) {
      if (status === 'online') return 'text-positive'
      if (status === 'dnd') return 'text-warning'
      return 'text-grey-6'
    },

    loadOlder (index, done) {
      const channelId = store.currentChannel
      setTimeout(() => {
        if (channelId !== store.currentChannel) return
        this.count += PAGE_SIZE
        done(this.count >= this.messages.length)
      }, 400)
    },

    submit () {
      const text = this.text.trim()
      if (!text) return

      if (text.startsWith('/')) {
        const result = executeCommand(text)
        this.$q.notify({
          message: result.message,
          color: result.ok ? 'positive' : 'negative',
          icon: result.ok ? 'check_circle' : 'error'
        })
        if (text.startsWith('/list') && result.ok) {
          this.rightDrawerOpen = true
        }
        this.text = ''
        return
      }

      const error = sendMessage(text)
      if (error) {
        this.$q.notify({ message: error, color: 'negative', icon: 'error' })
        return
      }
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

    handleCreateChannel () {
      const err = createChannel(this.newChannelName, this.newChannelIsPrivate)
      if (err) {
        this.$q.notify({ message: err, color: 'negative', icon: 'error' })
        return
      }
      this.$q.notify({ message: `Kanál #${this.newChannelName} bol vytvorený.`, color: 'positive', icon: 'check_circle' })
      this.newChannelName = ''
      this.newChannelIsPrivate = false
      this.showCreateDialog = false
    },

    confirmLeave () {
      this.$q.dialog({
        title: 'Opustiť kanál',
        message: `Naozaj chcete opustiť kanál #${this.channel.name}?${this.channel.admin === store.me.id ? ' Keďže ste správca, kanál týmto zanikne.' : ''}`,
        cancel: { flat: true, label: 'Zrušiť', color: 'grey-4' },
        ok: { flat: true, label: 'Opustiť', color: 'negative' },
        dark: true
      }).onOk(() => {
        leaveChannel(this.channel.id)
        this.$q.notify({ message: 'Kanál bol opustený.', color: 'info' })
      })
    },

    confirmDelete () {
      this.$q.dialog({
        title: 'Zrušiť kanál',
        message: `Naozaj chcete natrvalo zrušiť kanál #${this.channel.name}? Všetky správy a členstvá budú odstránené.`,
        cancel: { flat: true, label: 'Späť', color: 'grey-4' },
        ok: { unelevated: true, label: 'Zrušiť kanál', color: 'negative' },
        dark: true
      }).onOk(() => {
        deleteChannel(this.channel.id)
        this.$q.notify({ message: 'Kanál bol zrušený.', color: 'info' })
      })
    },

    async onLogout () {
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
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}

.channel-item {
  margin: 2px 4px;
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

.channel-actions {
  border-top: 1px solid rgba(251, 191, 36, 0.15);
  background: rgba(0, 0, 0, 0.2);
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
