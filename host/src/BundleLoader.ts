import { Platform, NativeModules } from 'react-native';

// This is a more modern approach for loading bundles in React Native
// inspired by how React Native handles loading modules

/**
 * Helper class for dynamically loading JS bundles on native platforms
 */
class BundleLoader {
  /**
   * Load a JavaScript bundle from a URL
   * @param bundleUrl URL of the bundle to load
   * @returns Promise that resolves when the bundle is loaded
   */
  static async loadBundleFromUrl(bundleUrl: string): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('BundleLoader.loadBundleFromUrl is only available on native platforms');
    }

    // Check if the DevLoadingView module is available (for showing loading indicator)
    const DevLoadingView = NativeModules.DevLoadingView;
    
    try {
      // Show loading indicator if available
      if (DevLoadingView) {
        DevLoadingView.showMessage('Loading bundle...', 'loading');
      }
      
      // On Android, we can use the DevServerHelper to load a bundle
      if (Platform.OS === 'android' && NativeModules.DevServerHelper) {
        await NativeModules.DevServerHelper.loadBundleFromURL(bundleUrl);
        return;
      }
      
      // On iOS, we can use the RCTBundleURLProvider
      if (Platform.OS === 'ios' && NativeModules.RCTBundleURLProvider) {
        await NativeModules.RCTBundleURLProvider.loadBundleFromURL(bundleUrl);
        return;
      }
      
      // If we can't find the native modules, throw an error
      throw new Error(
        `Unable to load bundle from URL: ${bundleUrl}. ` +
        `Native modules for bundle loading not available on ${Platform.OS}.`
      );
    } catch (error) {
      console.error('Error loading bundle:', error);
      throw error;
    } finally {
      // Hide loading indicator if available
      if (DevLoadingView) {
        DevLoadingView.hide();
      }
    }
  }
}

export default BundleLoader;