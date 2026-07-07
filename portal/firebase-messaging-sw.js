/* Service Worker do Firebase Cloud Messaging — Portal do Aluno (ROADMAP Hub H)
 * A configuração do Firebase é passada pela query string no registro do SW:
 *   navigator.serviceWorker.register('/firebase-messaging-sw.js?config=' + encodeURIComponent(JSON.stringify(cfg)))
 * Sem configuração, o worker fica inerte (não quebra o site).
 */
/* global firebase, importScripts */

let firebaseConfig = null;
try {
  const params = new URLSearchParams(self.location.search);
  firebaseConfig = JSON.parse(params.get('config') || 'null');
} catch (e) {
  firebaseConfig = null;
}

if (firebaseConfig && firebaseConfig.projectId) {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(payload => {
    const notification = payload.notification || {};
    self.registration.showNotification(notification.title || 'Portal do Aluno', {
      body: notification.body || 'Você tem uma nova atualização.',
      icon: '/assets/images/logo-192.png',
      data: payload.data || {}
    });
  });

  self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow('/'));
  });
}
