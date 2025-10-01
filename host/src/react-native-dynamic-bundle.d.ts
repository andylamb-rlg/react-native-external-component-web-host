declare module 'react-native-dynamic-bundle' {
  /**
   * Register a bundle with the given name and path
   * @param name The name to use for the bundle
   * @param path The path to the bundle file (relative to app documents directory)
   */
  export function registerBundle(name: string, path: string): Promise<void>;
  
  /**
   * Set the active bundle to be used the next time the app reloads
   * @param name The name of the registered bundle to activate
   */
  export function setActiveBundle(name: string): Promise<void>;
  
  /**
   * Unregister a previously registered bundle
   * @param name The name of the registered bundle to unregister
   */
  export function unregisterBundle(name: string): Promise<void>;
  
  /**
   * Force a reload of the bundle (will rebuild the RCTBridge)
   */
  export function reloadBundle(): void;
}