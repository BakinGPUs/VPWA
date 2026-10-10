<template>
  <div class="login-wrapper">
    <svg class="mosaic-bg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mosaicPattern" width="90" height="75" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
          <text
            x="70"
            y="37"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="system-ui, -apple-system, sans-serif"
            font-weight="900"
            font-size="16"
            fill="#fbbf24"
            fill-opacity="0.04"
          >
            YAP!
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mosaicPattern)" />
    </svg>

    <div class="login-card">
      <div class="logo-container">
        <img src="/assets/logo.png" alt="YAP! Logo" class="logo-img" />
        <div class="tagline">Rýchly &amp; jednoduchý chat</div>
      </div>

      <div class="header-section">
        <div class="form-title">{{ registerMode ? 'Vytvoriť účet' : 'Prihlásenie' }}</div>
        <div class="form-subtitle">
          {{ registerMode ? 'Vyplňte údaje a začnite yapovať' : 'Prihláste sa a píšte s priateľmi' }}
        </div>
      </div>

      <form v-if="registerMode" @submit.prevent="register" class="form-content">
        <div class="name-row">
          <q-input
            v-model="firstName"
            label="Meno"
            dark
            outlined
            dense
            color="amber-7"
            class="input-field"
          >
            <template #prepend>
              <q-icon name="person" size="18px" class="text-amber-5" />
            </template>
          </q-input>

          <q-input
            v-model="lastName"
            label="Priezvisko"
            dark
            outlined
            dense
            color="amber-7"
            class="input-field"
          >
            <template #prepend>
              <q-icon name="badge" size="18px" class="text-amber-5" />
            </template>
          </q-input>
        </div>

        <q-input
          v-model="nick"
          label="Nick / Prezývka"
          dark
          outlined
          dense
          color="amber-7"
          class="input-field"
        >
          <template #prepend>
            <q-icon name="alternate_email" size="18px" class="text-amber-5" />
          </template>
        </q-input>

        <q-input
          v-model="email"
          label="Email"
          type="email"
          dark
          outlined
          dense
          color="amber-7"
          class="input-field"
        >
          <template #prepend>
            <q-icon name="mail" size="18px" class="text-amber-5" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Heslo"
          type="password"
          dark
          outlined
          dense
          color="amber-7"
          class="input-field"
        >
          <template #prepend>
            <q-icon name="lock" size="18px" class="text-amber-5" />
          </template>
        </q-input>

        <q-btn
          type="submit"
          label="Registrovať sa"
          class="btn-yap full-width q-mt-sm"
          unelevated
          no-caps
        />
      </form>

      <form v-else @submit.prevent="login" class="form-content">
        <q-input
          v-model="email"
          label="Email"
          type="email"
          dark
          outlined
          dense
          color="amber-7"
          class="input-field"
        >
          <template #prepend>
            <q-icon name="mail" size="18px" class="text-amber-5" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Heslo"
          type="password"
          dark
          outlined
          dense
          color="amber-7"
          class="input-field"
        >
          <template #prepend>
            <q-icon name="lock" size="18px" class="text-amber-5" />
          </template>
        </q-input>

        <q-btn
          type="submit"
          label="Prihlásiť sa"
          class="btn-yap full-width q-mt-sm"
          unelevated
          no-caps
        />
      </form>

      <div class="footer-toggle">
        <span class="text-grey-5">
          {{ registerMode ? 'Už máte účet?' : 'Nemáte ešte účet?' }}
        </span>
        <button
          type="button"
          class="toggle-link"
          @click="registerMode = !registerMode"
        >
          {{ registerMode ? 'Prihláste sa' : 'Zaregistrujte sa' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data () {
    return {
      registerMode: false,
      firstName: '',
      lastName: '',
      nick: '',
      email: 'jozko@stuba.sk',
      password: 'heslo123'
    }
  },
  methods: {
    login () {
      this.$router.push('/hahahihi')
    },
    register () {
      this.$router.push('/hahahihi')
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background-color: #14171d;
  overflow: hidden;
}

.mosaic-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 380px;
  background: #1c2028;
  border-radius: 20px;
  padding: 34px 26px;
  box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(251, 191, 36, 0.22);
  display: flex;
  flex-direction: column;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
}

.logo-img {
  width: 135px;
  height: auto;
  filter: drop-shadow(0 4px 14px rgba(251, 191, 36, 0.3));
  transition: transform 0.25s ease;
}

.logo-img:hover {
  transform: scale(1.04) rotate(-1.5deg);
}

.tagline {
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-top: 6px;
}

.header-section {
  text-align: center;
  margin-bottom: 20px;
}

.form-title {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
}

.form-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-row {
  display: flex;
  gap: 10px;
}

.input-field :deep(.q-field__control) {
  border-radius: 12px;
  background-color: #161920;
}

.btn-yap {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
  color: #12151b !important;
  font-weight: 800;
  font-size: 15px;
  border-radius: 12px;
  padding: 10px 0;
  transition: all 0.2s ease;
}

.btn-yap:hover {
  box-shadow: 0 4px 20px -4px rgba(201, 177, 177, 0.45);;
  filter: brightness(1.10);
}

.footer-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 22px;
  font-size: 13px;
}

.toggle-link {
  background: none;
  border: none;
  padding: 0;
  font-weight: 700;
  color: #fbbf24;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.toggle-link:hover {
  color: #f59e0b;
}
</style>
