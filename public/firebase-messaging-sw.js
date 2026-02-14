importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD5VRJmvSddj0KJxWMV1R5IJJhwzRjig6o",
  projectId: "isp2026",
  messagingSenderId: "67619569460",
  appId: "1:67619569460:web:fe350ea5cffb6225f26f61"
});

const messaging = firebase.messaging();