import { Platform } from 'react-native';
import * as DynamicBundle from 'react-native-dynamic-bundle';

interface RemoteComponentType {
  ExternalComponent: React.ComponentType<{
    message?: string;
  }>;
}

let RemoteComponentCache: RemoteComponentType | null = null;

export const loadRemoteComponent = async (): Promise<RemoteComponentType> => {
  // Return cached component if already loaded
  if (RemoteComponentCache) {
    return RemoteComponentCache;
  }

  try {
    // Define possible URLs for the remote component
    // We'll try multiple URLs in case one doesn't work
    const possibleUrls = Platform.OS === 'web' 
      ? [
          'http://localhost:3000/bundle.web.js',
          'http://127.0.0.1:3000/bundle.web.js'
        ]
      : ['http://10.0.2.2:3000/bundle.js']; // 10.0.2.2 is localhost from Android emulator
    
    // Start with the first URL
    const bundleUrl = possibleUrls[0];
    
    console.log('Attempting to load bundle from:', bundleUrl, 'Will try alternatives if this fails');

    if (Platform.OS === 'web') {
      // Web-specific implementation using script tags
      return new Promise((resolve, reject) => {
        // Make React available in the global scope
        try {
          // Expose React to the window object for the external component to use
          const React = require('react');
          const ReactNative = require('react-native');
          
          // Make React and ReactNative available globally
          (window as any).React = React;
          (window as any).ReactNative = ReactNative;
          
          console.log('Successfully exposed React and ReactNative to global scope');
        } catch (err) {
          console.warn('Error exposing React to global scope:', err);
          // Continue anyway as React might be available from elsewhere
        }
        
        // First, check if component is already loaded
        if ((window as any).RemoteComponent) {
          console.log('RemoteComponent already loaded, reusing instance');
          RemoteComponentCache = (window as any).RemoteComponent;
          return resolve((window as any).RemoteComponent);
        }

        // Try loading from each URL in sequence until one works
        const tryLoadFromUrl = (urlIndex = 0) => {
          if (urlIndex >= possibleUrls.length) {
            reject(new Error('Failed to load remote component from all possible URLs'));
            return;
          }

          const currentUrl = possibleUrls[urlIndex];
          console.log(`Attempt ${urlIndex + 1}/${possibleUrls.length}: Loading remote component from:`, currentUrl);
          
          // Create script element to load the bundle
          const script = document.createElement('script');
          script.src = currentUrl;
          script.async = true;
          
          script.onload = () => {
            console.log('Bundle script loaded, checking for RemoteComponent');
            
            // Give a little time for the script to execute
            setTimeout(() => {
              if ((window as any).RemoteComponent) {
                console.log('RemoteComponent loaded successfully from', currentUrl);
                RemoteComponentCache = (window as any).RemoteComponent;
                resolve((window as any).RemoteComponent);
              } else {
                console.warn('RemoteComponent not found in window after loading from', currentUrl);
                // Try the next URL
                tryLoadFromUrl(urlIndex + 1);
              }
            }, 100);
          };
          
          script.onerror = (e) => {
            console.warn(`Error loading from ${currentUrl}:`, e);
            // Try the next URL
            tryLoadFromUrl(urlIndex + 1);
          };
          
          document.body.appendChild(script);
        };

        // Start trying with the first URL
        tryLoadFromUrl(0);
      });
    } else {
      // React Native implementation using DynamicBundle
      await DynamicBundle.loadBundle(bundleUrl);
      
      // We'd normally access the global.RemoteComponent here,
      // but for simplicity and type safety, let's import the component directly
      // This is simulating what would happen if the bundle sets a global
      
      // For this demo, we'll create a mock component since actual dynamic loading
      // requires more complex native module setup
      RemoteComponentCache = {
        ExternalComponent: ({ message = 'Dynamic Component (Mocked)' }) => {
          // This is a placeholder and would be replaced by the actual loaded component
          return require('../components/FallbackComponent').default({ message });
        }
      };
      
      return RemoteComponentCache;
    }
  } catch (error) {
    console.error('Error loading remote component:', error);
    throw error;
  }
};