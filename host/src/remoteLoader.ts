import { Platform, NativeModules } from 'react-native';

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
      // For React Native Mobile Platforms
      console.log('Attempting to load remote component on mobile from:', bundleUrl);
      
      try {
        // Here are three different approaches you can use for dynamic bundle loading on mobile:

        // APPROACH 1: Using Hermes engine's global.require functionality (Modern React Native)
        // Check if we're running on Hermes engine
        if ((global as any).HermesInternal) {
          console.log('Using Hermes engine to load bundle');
          
          // For Hermes, we need to set up event to wait for bundle to load
          const bundleLoadPromise = new Promise((resolve, reject) => {
            // Set a global callback that the loaded bundle will call
            (global as any).onBundleLoad = (exports: any) => {
              console.log('Bundle loaded via global callback');
              resolve(exports);
            };
            
            // Set a timeout in case bundle fails to load
            setTimeout(() => reject(new Error('Bundle load timeout')), 10000);
          });
          
          // Create a script tag that will fetch the bundle
          // The bundle should contain code that calls global.onBundleLoad with its exports
          // For example: global.onBundleLoad({ ExternalComponent: MyComponent });
          const scriptTag = document.createElement('script');
          scriptTag.src = bundleUrl;
          document.body.appendChild(scriptTag);
          
          // Wait for the bundle to load and call our callback
          const bundleExports = await bundleLoadPromise;
          RemoteComponentCache = bundleExports as RemoteComponentType;
        }
        // APPROACH 2: Using react-native-dynamic-bundle (if available)
        else if (NativeModules.RNDynamicBundle) {
          console.log('Using react-native-dynamic-bundle to load component');
          
          // Import dynamically to avoid issues if not installed
          const DynamicBundleModule = require('react-native-dynamic-bundle');
          const { registerBundle, setActiveBundle } = DynamicBundleModule;
          
          // For a real implementation, you would:
          // 1. Download the bundle to local filesystem first
          // 2. Register it with react-native-dynamic-bundle
          // 3. Set it as active
          // 4. Handle restarting the RN instance to apply it
          
          // This is a mock implementation for demo purposes
          console.log('react-native-dynamic-bundle methods available:', 
            Object.keys(DynamicBundleModule).join(', '));
          
          RemoteComponentCache = {
            ExternalComponent: ({ message = 'Mobile Component (react-native-dynamic-bundle)' }) => {
              return require('../components/FallbackComponent').default({ message });
            }
          };
        } 
        // APPROACH 3: Using the FallbackComponent directly
        else {
          console.log('Using fallback component as no dynamic loading method is available');
          
          RemoteComponentCache = {
            ExternalComponent: ({ message = 'Mobile Component (Fallback)' }) => {
              // This is a placeholder that would be replaced by the actual loaded component
              // in a real implementation
              return require('../components/FallbackComponent').default({ message });
            }
          };
        }
        
        console.log('Remote component loaded or fallback used');
        return RemoteComponentCache;
      } catch (error) {
        console.error('Error loading remote component on mobile:', error);
        
        // Always provide a fallback
        RemoteComponentCache = {
          ExternalComponent: ({ message = 'Error loading component' }) => {
            return require('../components/FallbackComponent').default({ message });
          }
        };
        
        return RemoteComponentCache;
      }
    }
  } catch (error) {
    console.error('Error loading remote component:', error);
    throw error;
  }
};