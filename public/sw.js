// Service Worker for Web Push Notifications and Background Sync
// Version 2.0 - Added background sync for delivery receipts

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Periodic sync for checking undelivered messages (Chrome 80+)
self.addEventListener('periodicsync', function(event) {
  console.log('[Service Worker] Periodic sync:', event.tag);
  
  if (event.tag === 'check-undelivered-messages') {
    event.waitUntil(markMessagesAsDelivered());
  }
});

// One-time background sync fallback
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'mark-messages-delivered') {
    event.waitUntil(markMessagesAsDelivered());
  }
});

// Function to mark messages as delivered via edge function
async function markMessagesAsDelivered() {
  try {
    // Get the auth token from IndexedDB or localStorage via client
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length === 0) {
      console.log('[Service Worker] No active clients, skipping delivery check');
      return;
    }

    // Request auth token from main thread
    const client = clients[0];
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = async (event) => {
        const { token, supabaseUrl } = event.data;
        
        if (!token || !supabaseUrl) {
          console.log('[Service Worker] No auth token available');
          resolve();
          return;
        }

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/mark-messages-delivered`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const result = await response.json();
          console.log('[Service Worker] Marked messages as delivered:', result);
          resolve();
        } catch (error) {
          console.error('[Service Worker] Error marking messages:', error);
          reject(error);
        }
      };

      client.postMessage({ type: 'GET_AUTH_TOKEN' }, [messageChannel.port2]);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.log('[Service Worker] Auth token request timed out');
        resolve();
      }, 10000);
    });
  } catch (error) {
    console.error('[Service Worker] Error in markMessagesAsDelivered:', error);
  }
}

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    return;
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: {
      url: data.url || '/',
      ...data.data
    },
    actions: data.actions || [],
    tag: data.tag || 'roomy-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false
  };

  // Show notification AND trigger delivery marking
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Roomy', options),
      markMessagesAsDelivered()
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
});

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'CHECK_DELIVERY') {
    event.waitUntil(markMessagesAsDelivered());
  }
});