// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Add Lottie support by extending asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'lottie', // Add Lottie files support
  'json'    // Ensure JSON files are supported (for Lottie animations)
];

// Apply NativeWind configuration
module.exports = withNativeWind(config, { 
  input: "./global.css",
  // Optional: Add these if you need additional PostCSS features
  // postcss: {
  //   plugins: [require('tailwindcss'), require('autoprefixer')],
  //   config: false
  // }
});