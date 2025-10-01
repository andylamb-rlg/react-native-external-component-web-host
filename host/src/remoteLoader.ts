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
      : [
          'http://10.0.2.2:3000/bundle.js',  // Android emulator - localhost equivalent
          'http://localhost:3000/bundle.js'  // iOS simulator
        ];
    
    // Start with the first URL - ensure it's a plain string
    const bundleUrl = String(possibleUrls[0]);
    
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
          
          // For React Native mobile, we need to use the fetch API instead of DOM methods
          console.log('Fetching bundle from URL:', bundleUrl);
          
          const bundleLoadPromise = new Promise((resolve, reject) => {
            console.log('Setting up bundle load promise with callback and timeout');
            
            // Check if callback already exists from previous attempts
            if ((global as any).onBundleLoad) {
              console.log('Warning: onBundleLoad callback already exists, replacing it');
            }
            
            // Set a global callback that the loaded bundle will call
            (global as any).onBundleLoad = (exports: any) => {
              console.log('Bundle loaded via global callback with exports:', 
                exports ? Object.keys(exports).join(', ') : 'no exports');
              
              // Check if exports have the expected shape
              if (exports && exports.ExternalComponent) {
                console.log('ExternalComponent found in exports, resolving promise');
                resolve(exports);
              } else {
                console.warn('Exports do not contain ExternalComponent!', exports);
                // Try to use RemoteComponent if available as fallback
                if ((global as any).RemoteComponent) {
                  console.log('Found RemoteComponent on global, using it as fallback');
                  resolve((global as any).RemoteComponent);
                } else {
                  reject(new Error('Invalid exports format from bundle'));
                }
              }
            };
            
            // Set up a check for RemoteComponent assignment as alternative to callback
            const checkForRemoteComponent = () => {
              if ((global as any).RemoteComponent) {
                console.log('RemoteComponent found on global, resolving promise');
                resolve((global as any).RemoteComponent);
                return true;
              }
              return false;
            };
            
            // Set a polling interval to check for RemoteComponent
            const pollInterval = setInterval(() => {
              if (checkForRemoteComponent()) {
                clearInterval(pollInterval);
              }
            }, 500); // Check every 500ms
            
            // Set a timeout in case bundle fails to load
            setTimeout(() => {
              clearInterval(pollInterval);
              
              console.error('Bundle load timeout! Bundle execution completed but onBundleLoad was never called');
              
              // Detailed diagnostics of what happened
              console.log('Bundle execution state:', {
                executionStarted: (global as any).__bundleExecutionStarted ? 'Yes' : 'No',
                executionCompleted: (global as any).__bundleExecutionCompleted ? 'Yes' : 'No',
                executionError: (global as any).__bundleExecutionError || 'None',
                timeElapsed: (global as any).__bundleExecutionStarted ? 
                  `${Date.now() - (global as any).__bundleExecutionStarted}ms` : 'Unknown'
              });
              
              // Display available global properties to help diagnose the issue
              const globalKeys = Object.keys(global).filter(key => !key.startsWith('_'));
              console.log('Global object keys available:', globalKeys.join(', '));
              
              // Check for React component-like objects that might have been exported incorrectly
              const possibleComponents = globalKeys.filter(key => {
                const value = (global as any)[key];
                return (
                  typeof value === 'function' || 
                  (typeof value === 'object' && value !== null && 
                   (typeof value.render === 'function' || typeof value.ExternalComponent === 'function' || typeof value.default === 'function'))
                );
              });
              
              if (possibleComponents.length > 0) {
                console.log('Possible component objects found on global:', possibleComponents.join(', '));
                
                // Try to use one of these as a last resort
                for (const key of possibleComponents) {
                  const value = (global as any)[key];
                  if (typeof value.ExternalComponent === 'function') {
                    console.log(`Found potential component at global.${key}.ExternalComponent, attempting to use it`);
                    resolve({ ExternalComponent: value.ExternalComponent });
                    return;
                  } else if (typeof value.default === 'function') {
                    console.log(`Found potential component at global.${key}.default, attempting to use it`);
                    resolve({ ExternalComponent: value.default });
                    return;
                  } else if (typeof value === 'function') {
                    console.log(`Found potential component function at global.${key}, attempting to use it`);
                    resolve({ ExternalComponent: value });
                    return;
                  }
                }
              }
              
              // Final attempt to check for RemoteComponent
              if (!checkForRemoteComponent()) {
                console.error('RemoteComponent not found on global object after timeout');
                console.log('Bundle URL attempted:', bundleUrl);
                console.log('Suggestion: Check the bundle format and ensure it properly calls global.onBundleLoad or sets global.RemoteComponent');
                reject(new Error('Bundle load timeout - component not exposed correctly'));
              }
            }, 10000);
            
            // Fetch and execute the bundle using async/await
            console.log('Fetching bundle from:', bundleUrl);
            
            // Using async IIFE to handle the fetch and avoid Promise chaining issues
            (async () => {
              try {
                const response = await fetch(bundleUrl);
                console.log('Bundle fetch response:', response.status, response.statusText);
                
                if (!response.ok) {
                  throw new Error(`Network response was not ok: ${response.status}`);
                }
                
                const bundleText = await response.text();
                // Log bundle size and first few characters
                console.log(`Bundle loaded, size: ${bundleText.length} bytes`);
                console.log(`Bundle preview: ${bundleText.substring(0, 100)}...`);
                
                // Analyze bundle content to provide guidance
                const bundleAnalysis = {
                  containsJSX: bundleText.includes('React.createElement') || bundleText.includes('createElement('),
                  containsStyleSheet: bundleText.includes('StyleSheet.create') || bundleText.includes('StyleSheet'),
                  hasExports: bundleText.includes('module.exports') || bundleText.includes('export default') || 
                              bundleText.includes('export const') || bundleText.includes('export function'),
                  hasGlobalAssignment: bundleText.includes('global.') || bundleText.includes('window.'),
                  hasOnBundleLoad: bundleText.includes('onBundleLoad'),
                  hasRemoteComponent: bundleText.includes('RemoteComponent'),
                  isMinified: bundleText.split('\n').length < 20 && bundleText.length > 500
                };
                
                console.log('Bundle analysis:', bundleAnalysis);
                
                // Provide guidance based on analysis
                if (!bundleAnalysis.hasOnBundleLoad && !bundleAnalysis.hasRemoteComponent) {
                  console.warn('Warning: Bundle does not appear to call onBundleLoad or set RemoteComponent');
                  console.log('Suggestion: Ensure your bundle contains code like: global.onBundleLoad({ExternalComponent: MyComponent})');
                }
                
                if (bundleAnalysis.isMinified) {
                  console.log('Note: Bundle appears to be minified, which can sometimes cause issues with Hermes');
                }
                
                // Execute the bundle code in the global context
                console.log('Preparing to evaluate bundle in Hermes environment');
                
                // Create a secure execution environment
                try {
                  console.log('Setting up global dependencies');
                  
                  // 1. Store any existing onBundleLoad handler
                  const originalOnBundleLoad = (global as any).onBundleLoad;
                  
                  // 2. Create a clean React/ReactNative environment
                  const React = require('react');
                  const ReactNative = require('react-native');
                  
                  // 3. Set up the environment with all necessary dependencies
                  Object.assign(global, {
                    // Core libraries
                    React,
                    ReactNative,
                    
                    // Common aliases and helpers
                    StyleSheet: ReactNative.StyleSheet,
                    
                    // Track execution
                    __bundleExecutionStarted: Date.now(),
                    __bundleExecutionCompleted: false,
                    
                    // Ensure original handler is preserved if needed
                    __originalOnBundleLoad: originalOnBundleLoad
                  });
                  
                  console.log('Environment prepared for bundle execution');
                  console.log('React Native components available:', 
                    Object.keys(ReactNative)
                      .filter(k => typeof ReactNative[k] === 'function' || typeof ReactNative[k] === 'object')
                      .join(', '));
                  
                  // Execute the bundle using the most compatible approach
                  console.log('Executing bundle...');
                  
                  // Method 1: Direct eval in global context (most compatible)
                  try {
                    // Add execution markers
                    const enhancedBundle = `
                      try {
                        // Original bundle code follows
                        ${bundleText}
                        // End of original bundle
                        
                        // Mark successful execution
                        global.__bundleExecutionCompleted = true;
                        global.__bundleExecutionError = null;
                        
                        // Log completion if no error
                        console.log('[Bundle Loader] Bundle executed successfully');
                      } catch (e) {
                        // Capture any error during execution
                        global.__bundleExecutionError = e;
                        console.error('[Bundle Loader] Error during bundle execution:', e);
                        throw e; // Re-throw for outer handler
                      }
                    `;
                    
                    // Execute in global context
                    global.eval(enhancedBundle);
                    console.log('Bundle execution completed via eval');
                    
                    // Check for remote component
                    checkForRemoteComponent();
                  } catch (evalError) {
                    console.error('Error during bundle eval:', evalError);
                    
                    // Fallback to Function constructor method
                    console.log('Trying Function constructor method as fallback...');
                    try {
                      const evalFn = new Function('global', 'React', 'ReactNative', bundleText);
                      evalFn(global, React, ReactNative);
                      console.log('Bundle execution completed via Function constructor');
                      
                      // Check for component
                      checkForRemoteComponent();
                    } catch (funcError) {
                      console.error('Function constructor method also failed:', funcError);
                      
                      // Last resort: Try a minimal wrapper that handles common module patterns
                      console.log('Trying minimal CommonJS-style wrapper as last resort...');
                      try {
                        const wrappedBundle = `
                          (function(exports, require, module, __filename, __dirname, global, React, ReactNative) {
                            ${bundleText}
                          })(
                            {}, 
                            require, 
                            { exports: {} }, 
                            "bundle.js", 
                            "/", 
                            global,
                            global.React,
                            global.ReactNative
                          );
                        `;
                        global.eval(wrappedBundle);
                        console.log('Bundle execution completed via CommonJS wrapper');
                        
                        // Check for component
                        checkForRemoteComponent();
                      } catch (wrappedError) {
                        console.error('All bundle execution methods failed');
                        reject(new Error('Bundle execution failed with all methods'));
                      }
                    }
                  }
                } catch (setupError) {
                  console.error('Error setting up bundle execution environment:', setupError);
                  reject(new Error(`Failed to set up bundle execution environment: ${setupError instanceof Error ? setupError.message : 'Unknown error'}`));
                }
                
                // Note: We're expecting the bundle to call global.onBundleLoad
                // The promise will be resolved when that happens
                console.log('Bundle execution complete, waiting for callback or RemoteComponent...');
              } catch (error) {
                console.error('Error fetching or evaluating bundle:', error);
                // Check if the error is related to network or something else
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('Network request failed') || errorMessage.includes('NETWORK_ERROR')) {
                  console.error('Network error detected. Make sure the bundle URL is accessible from the device.');
                  console.error(`URL being accessed: ${bundleUrl}`);
                  console.error('If running in an emulator, ensure you\'re using the correct IP address (10.0.2.2 for Android emulator)');
                } else {
                  console.error('Non-network error occurred during bundle loading');
                }
                reject(error);
              }
            })();
          });
          
          try {
            // Wait for the bundle to load and call our callback
            console.log('Awaiting bundle load promise resolution...');
            const bundleExports = await bundleLoadPromise;
            console.log('Bundle load promise resolved with exports');
            RemoteComponentCache = bundleExports as RemoteComponentType;
          } catch (error) {
            console.error('Error waiting for bundle to load:', error);
            console.error('Bundle load failed, creating fallback component');
            
            // Provide a fallback component if bundle loading fails
            RemoteComponentCache = {
              ExternalComponent: ({ message = 'Hermes Bundle Load Failed: ' + 
                (error instanceof Error ? error.message : 'Unknown error') }) => {
                console.log('Rendering fallback component due to load failure');
                return require('../components/FallbackComponent').default({ message });
              }
            };
          }
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