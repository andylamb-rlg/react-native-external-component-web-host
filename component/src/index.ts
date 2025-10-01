import ExternalComponent, { ExternalComponent as ExternalComponentNamed } from './ExternalComponent';

// Create a module exports object
const RemoteComponent = {
  ExternalComponent
};

// This allows webpack to handle the exports properly when bundled as UMD
export { ExternalComponentNamed as ExternalComponent };
export default RemoteComponent;