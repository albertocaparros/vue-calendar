import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import VueTextareaAutosize from 'vue-textarea-autosize';
import firebase from 'firebase/app';
import 'firebase/firestore';

Vue.use(VueTextareaAutosize);
Vue.config.productionTip = false;

firebase.initializeApp({
  apiKey: 'AIzaSyB_A80v0N61DW1C2FfG_ewXczOxj9AsoVc',
  authDomain: 'vue-calendar-40474.firebaseapp.com',
  databaseURL: 'https://vue-calendar-40474.firebaseio.com',
  projectId: 'vue-calendar-40474',
  storageBucket: 'vue-calendar-40474.appspot.com',
  messagingSenderId: '847605569002',
  appId: '1:847605569002:web:7cebb0b9d8c6f5bbb4ce93',
});

export const db = firebase.firestore();

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
