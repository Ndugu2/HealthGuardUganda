import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Fix for blank page on web: ensure the root container has 100% height
if (Platform.OS === 'web') {
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
