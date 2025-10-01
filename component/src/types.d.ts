declare global {
  interface Window {
    RemoteComponent: any;
  }
  
  namespace NodeJS {
    interface Global {
      RemoteComponent: any;
    }
  }
}

export {};