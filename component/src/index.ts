import ExternalComponent, { ExternalComponent as ExternalComponentNamed } from './ExternalComponent';

// Create a module exports object
const RemoteComponent = {
  ExternalComponent
};

// This explicitly exposes RemoteComponent to the global scope
// This helps ensure it's available in both web and React Native environments
if (typeof global !== 'undefined') {
  // For React Native
  (global as any).RemoteComponent = RemoteComponent;
  
  // If there's an onBundleLoad callback waiting, call it
  if (typeof (global as any).onBundleLoad === 'function') {
    try {
      console.log('[index] Calling global.onBundleLoad from index.ts');
      (global as any).onBundleLoad(RemoteComponent);
    } catch (e) {
      console.error('[index] Error calling onBundleLoad:', e);
    }
  }
} else if (typeof window !== 'undefined') {
  // For web
  (window as any).RemoteComponent = RemoteComponent;
  
  // If there's an onBundleLoad callback waiting, call it
  if (typeof (window as any).onBundleLoad === 'function') {
    try {
      console.log('[index] Calling window.onBundleLoad from index.ts');
      (window as any).onBundleLoad(RemoteComponent);
    } catch (e) {
      console.error('[index] Error calling onBundleLoad:', e);
    }
  }
}

// This allows webpack to handle the exports properly when bundled as UMD
export { ExternalComponentNamed as ExternalComponent };
export default RemoteComponent;