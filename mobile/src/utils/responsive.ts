import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive width percentage
export const wp = (widthPercent: number): number => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

// Responsive height percentage
export const hp = (heightPercent: number): number => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

// Scale based on screen width
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

// Vertical scale based on screen height
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

// Moderate scale with factor
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Responsive font size
export const fontScale = (size: number): number => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Get device type
export const getDeviceType = (): 'phone' | 'tablet' => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return aspectRatio > 1.6 ? 'phone' : 'tablet';
};

// Check if device is small
export const isSmallDevice = (): boolean => SCREEN_WIDTH < 375;

// Check if device is large
export const isLargeDevice = (): boolean => SCREEN_WIDTH >= 414;

// Check platform
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Get screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Device breakpoints
export const breakpoints = {
  small: 320,    // Small phones (iPhone SE, older Android)
  medium: 375,   // Standard phones (iPhone 12/13/14)
  large: 414,    // Large phones (iPhone Plus/Max)
  tablet: 768,   // Tablets
};

// Get current breakpoint
export const getCurrentBreakpoint = (): 'small' | 'medium' | 'large' | 'tablet' => {
  if (SCREEN_WIDTH >= breakpoints.tablet) return 'tablet';
  if (SCREEN_WIDTH >= breakpoints.large) return 'large';
  if (SCREEN_WIDTH >= breakpoints.medium) return 'medium';
  return 'small';
};

// Screen orientation listener helper
export const addOrientationListener = (
  callback: (dimensions: ScaledSize) => void
): (() => void) => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback(window);
  });
  return () => subscription.remove();
};

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  getDeviceType,
  isSmallDevice,
  isLargeDevice,
  isIOS,
  isAndroid,
  screenWidth,
  screenHeight,
  breakpoints,
  getCurrentBreakpoint,
  addOrientationListener,
};

