const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log function for better visibility
function logStep(message) {
  console.log(`\n=== ${message} ===`);
}

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  logStep('Creating dist directory');
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Step 1: Compile TypeScript
  logStep('Compiling TypeScript');
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Step 2: Bundle with webpack
  logStep('Creating bundle with webpack');
  execSync('npx webpack', { stdio: 'inherit' });

  // Step 3: Create a web-specific version that handles both React Native and React DOM
  logStep('Creating web-compatible version');
  
  const webPolyfill = `
// Web compatibility layer - prepend to bundle
(function() {
  if (typeof window !== 'undefined' && typeof window.ReactNative === 'undefined' && window.React) {
    // Provide minimal polyfills for React Native components when in web environment
    window.ReactNative = {
      View: 'div',
      Text: 'span',
      StyleSheet: {
        create: function(styles) { 
          // Convert RN styles to web compatible styles
          const webStyles = {};
          
          for (const key in styles) {
            if (styles.hasOwnProperty(key)) {
              webStyles[key] = styles[key];
              // Convert any camelCase to kebab-case for CSS
              // Handle any RN-specific style props
              if (webStyles[key].hasOwnProperty('borderRadius')) {
                webStyles[key].borderRadius = webStyles[key].borderRadius + 'px';
              }
            }
          }
          
          return webStyles; 
        }
      }
    };
    
    console.log('Applied React Native web polyfills');
  }
})();
`;

  // Read the webpack bundle
  const bundlePath = path.join(distDir, 'bundle.js');
  const bundle = fs.readFileSync(bundlePath, 'utf8');
  
  // Read the bundle wrapper that ensures onBundleLoad is called
  const wrapperPath = path.join(distDir, 'bundle-wrapper.js');
  let wrapper = '';
  if (fs.existsSync(wrapperPath)) {
    wrapper = fs.readFileSync(wrapperPath, 'utf8');
  } else {
    // Create wrapper if it doesn't exist
    wrapper = `
// This wrapper ensures the bundle calls global.onBundleLoad when loaded
(function() {
  if (typeof global !== 'undefined' && global.onBundleLoad && typeof global.RemoteComponent !== 'undefined') {
    console.log('[bundle-wrapper] Detected RemoteComponent, calling onBundleLoad');
    global.onBundleLoad(global.RemoteComponent);
  } else if (typeof window !== 'undefined' && window.onBundleLoad && typeof window.RemoteComponent !== 'undefined') {
    console.log('[bundle-wrapper] Detected RemoteComponent in window, calling window.onBundleLoad');
    window.onBundleLoad(window.RemoteComponent);
  } else {
    console.warn('[bundle-wrapper] Could not call onBundleLoad: callback or RemoteComponent not found');
  }
})();`;
    fs.writeFileSync(wrapperPath, wrapper);
  }
  
  // Update the main bundle to include the wrapper
  fs.writeFileSync(bundlePath, bundle + '\n' + wrapper);
  
  // Create a web-specific version with polyfills
  const webBundlePath = path.join(distDir, 'bundle.web.js');
  fs.writeFileSync(webBundlePath, webPolyfill + bundle);
  
  logStep('Component built successfully!');
  console.log(`
Output files:
- ${path.join(distDir, 'bundle.js')} - Main UMD bundle
- ${path.join(distDir, 'bundle.web.js')} - Web-compatible bundle with polyfills
- TypeScript declaration files in dist/
`);

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}