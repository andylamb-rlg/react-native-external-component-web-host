// Type declarations for RemoteComponent
declare global {
  interface Window {
    RemoteComponent: {
      ExternalComponent: React.ComponentType<{
        message?: string;
      }>;
    };
  }
}