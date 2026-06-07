import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Fix for blank page on web: ensure the root container has 100% height
if (Platform.OS === 'web') {
  // Set document title
  document.title = 'HealthGuard Uganda';

  // Set favicon
  document.querySelectorAll("link[rel*='icon']").forEach(el => el.parentNode?.removeChild(el));
  const link = document.createElement('link');
  link.type = 'image/svg+xml';
  link.rel = 'shortcut icon';
  link.href = '/favicon.svg';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root, [data-contents="true"] {
      height: 100% !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      margin: 0;
      padding: 0;
    }
    #root > div {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `;
  document.head.appendChild(style);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
