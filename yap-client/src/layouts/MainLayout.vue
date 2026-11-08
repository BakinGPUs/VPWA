<template>
  <q-layout v-if="store.me" view="hHh LpR fFf" class="yap-layout">
    <!--hlavicka-->
    <q-header bordered class="yap-header">
      <q-toolbar class="q-px-sm q-px-md-md header-toolbar">
        <q-btn flat round dense icon="menu" class="q-mr-xs" @click="leftDrawerOpen = !leftDrawerOpen">
          <q-tooltip>Zoznam kanálov</q-tooltip>
        </q-btn>
        <img src="/assets/logo.png" alt="YAP!" class="header-logo gt-xs" />

        <q-toolbar-title class="text-subtitle1 row items-center no-wrap header-title">
          <template v-if="channel">
            <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="18px" class="text-amber-5 q-mr-xs shrink-0" />
            <span class="ellipsis">{{ channel.name }}</span>
            <q-badge
              v-if="channel.admin === store.me.id"
              color="amber-8"
              text-color="dark"
              class="q-ml-xs shrink-0 gt-xs"
              label="správca"
            />
          </template>
          <span v-else class="text-grey-5 text-body2 ellipsis">YAP!</span>
        </q-toolbar-title>

        <!--test notifikacie, sprava pride o 5s-->
        <q-btn
          flat
          dense
          no-caps
          color="amber-5"
          icon="notifications_active"
          :label="$q.screen.gt.sm ? 'Test notifikácie (5s)' : ''"
          class="q-mr-xs gt-xs"
          @click="scheduleTestMessage"
        >
          <q-tooltip>Pošle správu o 5 sekúnd (prepnite na inú kartu na otestovanie notifikácie)</q-tooltip>
        </q-btn>

        <!--clenovia-->
        <q-btn
          v-if="channel && !isInvited(channel.id)"
          flat
          dense
          no-caps
          icon="group"
          :label="$q.screen.gt.xs ? membersCountText : String(currentMembers.length)"
          class="q-mr-xs header-action-btn"
          @click="rightDrawerOpen = !rightDrawerOpen"
        >
          <q-tooltip>Zoznam členov kanála (/list)</q-tooltip>
        </q-btn>

        <!--stav online/dnd/offline-->
        <q-btn-dropdown
          flat
          dense
          no-caps
          :color="statusColor(store.me.status)"
          class="q-mr-xs header-status-btn"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <q-icon name="circle" size="10px" class="q-mr-xs" :class="statusColorClass(store.me.status)" />
              <span class="text-caption text-bold uppercase">{{ store.me.status }}</span>
            </div>
          </template>
          <q-list class="bg-grey-9 text-white" style="min-width: 160px">
            <q-item-label header class="text-grey-4 text-caption q-pb-xs">
              Prihlásený ako <strong class="text-amber-5">@{{ store.me.nick }}</strong>
            </q-item-label>
            <q-separator dark class="q-mb-xs" />
            <q-item clickable v-close-popup @click="changeStatus('online')">
              <q-item-section avatar style="min-width: 28px">
                <q-icon name="circle" size="10px" class="text-positive" />
              </q-item-section>
              <q-item-section>Online</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="changeStatus('dnd')">
              <q-item-section avatar style="min-width: 28px">
                <q-icon name="circle" size="10px" class="text-warning" />
              </q-item-section>
              <q-item-section>DND (nerušiť)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="changeStatus('offline')">
              <q-item-section avatar style="min-width: 28px">
                <q-icon name="circle" size="10px" class="text-grey-6" />
              </q-item-section>
              <q-item-section>Offline</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <span class="text-grey-4 q-mr-sm text-caption gt-sm">@{{ store.me.nick }}</span>
        <q-btn flat round dense icon="logout" @click="onLogout">
          <q-tooltip>Odhlásiť sa</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!--lavy panel - kanaly-->
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
          Nie ste členom žiadneho kanála. Vytvorte si nový alebo napíšte <code>/join nazov</code>.
        </div>
      </div>

      <!--spodok panela-->
      <div>
        <!--notifikacie-->
        <div class="q-pa-sm notification-settings">
          <div class="text-caption text-amber-5 text-bold q-mb-xs">Nastavenia notifikácií</div>
          <q-toggle
            v-model="store.onlyMe"
            dense
            color="amber-7"
            label="Iba adresované mne (@)"
            class="text-caption text-grey-4 q-mb-xs"
          />
          <div v-if="notificationPermissionNeeded" class="q-mt-xs">
            <q-btn
              size="xs"
              outline
              color="amber-5"
              label="Povoliť notifikácie v prehliadači"
              class="full-width"
              no-caps
              @click="requestNotificationPermission"
            />
          </div>
          <div class="lt-sm q-mt-xs">
            <q-btn
              size="xs"
              flat
              color="amber-4"
              icon="notifications"
              label="Test notifikácie (5s)"
              class="full-width"
              no-caps
              @click="scheduleTestMessage"
            />
          </div>
        </div>

        <!--akcie kanala-->
        <div v-if="channel && !isInvited(channel.id)" class="channel-actions q-pa-sm">
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
      </div>
    </q-drawer>

    <!--pravy panel - clenovia (/list)-->
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

    <!--spravy-->
    <q-page-container>
      <q-page :style-fn="pageHeight" class="column">
        <!--offline banner-->
        <q-banner v-if="store.me.status === 'offline'" dense class="bg-grey-9 text-grey-4 text-caption text-center">
          <q-icon name="cloud_off" size="16px" class="q-mr-xs text-grey-5" />
          Ste v stave <strong>Offline</strong>. Nové správy sa nezobrazujú. Po prepnutí do Online sa kanály automaticky aktualizujú.
        </q-banner>

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

    <!--prikazovy riadok-->
    <q-footer bordered class="yap-footer">
      <!--kto pise-->
      <div v-if="currentTypers.length" class="typing-bar text-caption q-px-xs q-pb-xs row items-center">
        <q-spinner-dots size="14px" color="amber-5" class="q-mr-xs" />
        <span class="text-grey-4">
          <template v-for="(typer, idx) in currentTypers" :key="typer.user">
            <a href="#" class="typer-link text-amber-5 text-bold" @click.prevent="openTypingPreview(typer)">
              {{ getUser(typer.user)?.nick }}
            </a>
            <span v-if="idx < currentTypers.length - 1">, </span>
          </template>
          píše správu...
          <span class="text-grey-6 text-italic q-ml-xs">(kliknite na meno pre živý náhľad)</span>
        </span>
      </div>

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

    <!--novy kanal dialog-->
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

    <!--nahlad rozpisanej spravy-->
    <q-dialog v-model="showTypingDialog" @hide="stopTypingSimulation">
      <q-card class="bg-grey-9 text-white" style="min-width: 340px; max-width: 480px; border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.3)">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-bold text-amber-5 row items-center">
              <q-spinner-dots size="16px" class="q-mr-xs" />
              Živý náhľad rozpísanej správy
            </div>
            <div class="text-caption text-grey-4">
              Od: @{{ activePreviewUser?.nick }} ({{ activePreviewUser?.firstName }} {{ activePreviewUser?.lastName }})
            </div>
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="live-preview-box q-pa-md rounded-borders">
            <span class="preview-text">{{ activePreviewTyper?.text }}</span>
            <span class="blinking-cursor">|</span>
          </div>
          <div class="text-caption text-grey-5 q-mt-sm row items-center">
            <q-icon name="visibility" size="14px" class="q-mr-xs text-amber-5" />
            Text sa aktualizuje v reálnom čase ešte pred odoslaním.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-sm">
          <q-btn flat label="Zavrieť" color="amber-5" no-caps v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import {
  store, getUser, myChannels, isInvited, isMentioned, channelMessages, channelMembers,
  channelTyping, sendMessage, acceptInvite, declineInvite, leaveChannel, deleteChannel,
  createChannel, executeCommand, setStatus, triggerIncomingMessage, logout
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
      newChannelIsPrivate: false,
      showTypingDialog: false,
      activePreviewTyper: null,
      typingIntervalId: null,
      notificationPermissionNeeded: false
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
    currentTypers () {
      return store.currentChannel ? channelTyping(store.currentChannel) : []
    },
    activePreviewUser () {
      return this.activePreviewTyper ? getUser(this.activePreviewTyper.user) : null
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
    this.checkNotificationPermission()
  },
  beforeUnmount () {
    this.stopTypingSimulation()
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

    statusColor (status) {
      if (status === 'online') return 'positive'
      if (status === 'dnd') return 'warning'
      return 'grey-6'
    },

    statusColorClass (status) {
      if (status === 'online') return 'text-positive'
      if (status === 'dnd') return 'text-warning'
      return 'text-grey-6'
    },

    changeStatus (newStatus) {
      setStatus(newStatus)
      this.$q.notify({
        message: `Váš stav bol zmenený na ${newStatus.toUpperCase()}`,
        color: this.statusColor(newStatus),
        timeout: 1500
      })
    },

    checkNotificationPermission () {
      if ('Notification' in window && Notification.permission !== 'granted') {
        this.notificationPermissionNeeded = true
      }
    },

    async requestNotificationPermission () {
      if ('Notification' in window) {
        const res = await Notification.requestPermission()
        if (res === 'granted') {
          this.notificationPermissionNeeded = false
          this.$q.notify({ message: 'Notifikácie boli povolené', color: 'positive' })
        }
      }
    },

    //test sprava o 5s
    scheduleTestMessage () {
      this.$q.notify({
        message: 'Testovacia správa príde o 5 sekúnd. Prepnite na inú kartu alebo minimalizujte prehliadač!',
        color: 'amber-8',
        icon: 'timer',
        timeout: 4500
      })

      setTimeout(() => {
        const msg = triggerIncomingMessage()
        this.handleMessageNotification(msg)
      }, 5000)
    },

    handleMessageNotification (msg) {
      var channel = this.channels.find(item => item.id === msg.channel)
      var supported = 'Notification' in window && Notification.permission === 'granted'

      //appka musi byt schovana a ja nesmiem byt dnd/offline
      var canNotify = !this.$q.appVisible && store.me.status === 'online'

      //musim byt v kanali (nie len pozvany)
      var inChannel = channel && !isInvited(channel.id)

      //ked mam zapnute iba pre mna tak musim byt oznaceny

      
      var forMe = !store.onlyMe || isMentioned(msg)

      if (!supported || !canNotify || !inChannel || !forMe) return

      var sender = getUser(msg.user)
      var name = sender ? sender.nick : 'Používateľ'
      var text = msg.text
      if (text.length > 50) text = text.substring(0, 47) + '...'

      new Notification('@' + name + ' (#' + channel.name + ')', {
        body: text,
        icon: '/assets/logo.png'
      })
    },

    //nahlad pisania
    openTypingPreview (typer) {
      this.activePreviewTyper = typer
      this.showTypingDialog = true
      this.startTypingSimulation(typer)
    },

    startTypingSimulation (typer) {
      this.stopTypingSimulation()
      const additionalWords = [
        ' a', ' ešte', ' k', ' tomu', ' som', ' doplnil', ' podporu', ' pre', ' offline', ' režim',
        ' aj', ' notifikácie', ' podľa', ' zadania', '.'
      ]
      let wordIdx = 0

      this.typingIntervalId = setInterval(() => {
        if (!this.showTypingDialog || !typer) return
        if (wordIdx < additionalWords.length) {
          typer.text += additionalWords[wordIdx]
          wordIdx++
        } else {
          //znova od zaciatku
          typer.text = 'ja si myslím, že ten deadline posunú, ale ešte to neoverili...'
          wordIdx = 0
        }
      }, 350)
    },

    stopTypingSimulation () {
      if (this.typingIntervalId) {
        clearInterval(this.typingIntervalId)
        this.typingIntervalId = null
      }
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

.header-toolbar {
  min-height: 50px;
  gap: 2px;
}

.header-title {
  min-width: 0;
  padding: 0 4px;
}

.shrink-0 {
  flex-shrink: 0;
}

.header-action-btn,
.header-status-btn {
  padding: 4px 6px;
}

.header-logo {
  height: 30px;
  margin-right: 6px;
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

.notification-settings {
  border-top: 1px solid rgba(251, 191, 36, 0.15);
  background: rgba(0, 0, 0, 0.15);
}

.channel-actions {
  border-top: 1px solid rgba(251, 191, 36, 0.15);
  background: rgba(0, 0, 0, 0.25);
}

.typing-bar {
  border-bottom: 1px solid rgba(251, 191, 36, 0.15);
  margin-bottom: 6px;
}

.typer-link {
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.typer-link:hover {
  color: #f59e0b;
}

.live-preview-box {
  background: #161920;
  border: 1px solid rgba(251, 191, 36, 0.2);
  min-height: 80px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.blinking-cursor {
  animation: blink 1s step-start infinite;
  color: #fbbf24;
  font-weight: bold;
}

@keyframes blink {
  50% { opacity: 0; }
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
