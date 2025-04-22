export const lightColors = {
  primary: '#1DA1F2',         // Twitter blue
  background: '#FFFFFF',      // Pure white
  card: '#F7F9F9',           // Very light gray-blue
  text: '#0F1419',           // Twitter dark text
  subText: '#536471',        // Twitter gray text
  border: '#EFF3F4',         // Light gray borders
  inputBg: '#FFFFFF',        // White input background
  placeholder: '#8899A6',    // Light placeholder text
  icon: '#657786',           // Light mode icon color
  errorBg: '#FBEAE9',        // Light error background
  errorText: '#E0245E',      // Light error text
};

export const darkColors = {
  primary: '#1DA1F2',        // Still Twitter blue
  background: '#000000',     // Twitter black background
  card: '#16181C',           // Dark card (Twitter uses this for timelines/cards)
  text: '#E7E9EA',           // Light gray text
  subText: '#71767B',        // Dimmed text
  border: '#2F3336',         // Dark border lines
  inputBg: '#1E1E1E',        // Dark input background
  placeholder: '#6E767D',    // Dark placeholder text
  icon: '#6E767D',           // Dark mode icon color
  errorBg: '#2C0B0E',        // Dark error background
  errorText: '#F4212E',      // Dark error text
};

export const getThemeColors = (isDark) => (isDark ? darkColors : lightColors);