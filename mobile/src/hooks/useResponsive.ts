import { useState, useEffect, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  getCurrentBreakpoint,
  getDeviceType,
  isSmallDevice,
  isLargeDevice,
  breakpoints,
} from '../utils/responsive';

interface ResponsiveValues {
  screenWidth: number;
  screenHeight: number;
  breakpoint: 'small' | 'medium' | 'large' | 'tablet';
  deviceType: 'phone' | 'tablet';
  isSmall: boolean;
  isLarge: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  const updateDimensions = useCallback(({ window }: { window: ScaledSize }) => {
    setDimensions(window);
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription.remove();
  }, [updateDimensions]);

  const responsive: ResponsiveValues = {
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    breakpoint: getCurrentBreakpoint(),
    deviceType: getDeviceType(),
    isSmall: isSmallDevice(),
    isLarge: isLargeDevice(),
    isPortrait: dimensions.height > dimensions.width,
    isLandscape: dimensions.width > dimensions.height,
  };

  // Responsive style helpers
  const rs = useCallback((small: number, medium?: number, large?: number, tablet?: number) => {
    const { breakpoint } = responsive;
    switch (breakpoint) {
      case 'tablet':
        return tablet ?? large ?? medium ?? small;
      case 'large':
        return large ?? medium ?? small;
      case 'medium':
        return medium ?? small;
      default:
        return small;
    }
  }, [responsive]);

  return {
    ...responsive,
    wp,
    hp,
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    breakpoints,
    rs,
  };
};

export default useResponsive;

