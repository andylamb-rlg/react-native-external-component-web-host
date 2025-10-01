# React Native External Component Integration

This project demonstrates how to load an external React Native component from a separate bundle into a host Expo application. The setup consists of two main parts:

1. **Host App (Expo)**: A React Native app using Expo that loads an external component
2. **Component Package**: A standalone React Native component that is bundled and served externally

## Project Structure

```
test-react-native-expo/
├── component/                 # External component package
│   ├── src/                   # Source code for the component
│   │   ├── ExternalComponent.tsx  # The external component
│   │   ├── index.ts           # Entry point for the component package
│   │   └── types.d.ts         # TypeScript definitions
│   ├── build.js               # Script to build the component bundle
│   ├── webpack.config.js      # Webpack configuration for UMD bundling
│   ├── package.json           # Package configuration
│   ├── tsconfig.json          # TypeScript configuration
│   └── dist/                  # Output directory for bundles
│       ├── bundle.js          # Main UMD bundle for React Native
│       └── bundle.web.js      # Web-compatible bundle with polyfills
│
└── host/                      # Host application (Expo)
    ├── src/                   # Source code for the host app
    │   └── remoteLoader.ts    # Utility to load the remote component
    ├── components/            # Local components
    │   └── FallbackComponent.tsx  # Fallback component when remote fails
    ├── App.tsx                # Main application component
    └── package.json           # Package configuration
```

## Running the Project

### Step 1: Build and Serve the Component

First, we need to build the external component and start the server to serve the bundle:

```powershell
cd component
npm run start
```

This will:
1. Compile the TypeScript code
2. Create the UMD bundle with webpack
3. Generate a web-compatible version with polyfills
4. Start an HTTP server on port 3000 to serve the bundle

### Step 2: Start the Host App

In a new terminal window, start the host Expo application:

```powershell
cd host
npm run web
```

This will start the Expo development server and launch the browser. You can then:
- Use the Expo Go app on your device to scan the QR code for mobile testing
- Choose Android to open in an Android emulator (if installed)
- Choose iOS to open in an iOS simulator (if on macOS)

## How It Works

### UMD Bundle Format

The component is built as a Universal Module Definition (UMD) bundle, which allows it to work in multiple environments:
- CommonJS (Node.js)
- AMD (RequireJS)
- Global variables in browsers
- React Native

The UMD format wraps the code in a function that detects the environment and chooses the appropriate module system.

### Dynamic Loading Process

1. The host app tries to load the component bundle from the server:
   - On web: Using script tags to load the bundle dynamically
   - On React Native: Using the react-native-dynamic-bundle library

2. Once loaded, the component is available through a global object (`RemoteComponent`):
   ```javascript
   const { ExternalComponent } = RemoteComponent;

   ```
## Advanced Features

The external component demonstrates:
- Fetching data from an external API
- Managing component state with React hooks
- Preventing duplicate API calls with mount tracking
- Proper error handling and loading states

## Notes

- For mobile, the implementation is simplified. In a production environment, you would need additional setup to properly load and evaluate JavaScript bundles on mobile devices.
- The IP address `10.0.2.2` is used to access the localhost from Android emulators. You might need to adjust this depending on your testing environment.
- For iOS simulators, you might need to use `localhost` instead.