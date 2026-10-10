<template>
  <div style="width: 300px; margin: 50px auto">
    <img src="/assets/logo.png" style="width: 120px">
    <div v-if="registerMode">
      <q-input v-model="firstName" label="meno" />
      <q-input v-model="lastName" label="priezvisko" />
      <q-input v-model="nick" label="nick" />
      <q-input v-model="email" label="email" />
      <q-input v-model="password" label="heslo" type="password" />
      <br>
      <q-btn label="registrovat" color="primary" @click="register" />
    </div>
    <div v-else>
      <q-input v-model="email" label="email" />
      <q-input v-model="password" label="heslo" type="password" />
      <br>
      <q-btn label="login" color="primary" @click="login" />
    </div>
    <br>
    <a href="#" @click.prevent="registerMode = !registerMode">{{ registerMode ? 'login' : 'registracia' }}</a>
  </div>
</template>

<script>
import { db, loadData } from 'src/db'

export default {
  data () {
    return { registerMode: false, firstName: '', lastName: '', nick: '', email: 'jozko@stuba.sk', password: 'heslo123' }
  },
  mounted () {
    loadData()
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
