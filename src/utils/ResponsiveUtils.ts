// // ResponsiveUtils.ts - Create this file in your project
// import {Dimensions, PixelRatio, Platform, ScaledSize} from 'react-native';

// // Get the current window dimensions
// const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// // Base dimensions - standard size we're designing for
// const baseWidth = 375; // iPhone X width
// const baseHeight = 812; // iPhone X height

// // Scales
// const widthScale = SCREEN_WIDTH / baseWidth;
// const heightScale = SCREEN_HEIGHT / baseHeight;

// /**
//  * Responsive width calculation
//  * @param size - Size in pixels for base screen width
//  */
// export const wp = (size: number): number => {
//   return PixelRatio.roundToNearestPixel(size * widthScale);
// };

// /**
//  * Responsive height calculation
//  * @param size - Size in pixels for base screen height
//  */
// export const hp = (size: number): number => {
//   return PixelRatio.roundToNearestPixel(size * heightScale);
// };

// /**
//  * Responsive font size calculation
//  * @param size - Font size in pixels for base screen
//  */
// export const fontSize = (size: number): number => {
//   // Scale based on width but not too aggressively
//   const scaleFactor = Math.min(widthScale, 1.2); // Cap scale factor to avoid excessively large fonts on tablets
//   return PixelRatio.roundToNearestPixel(size * scaleFactor);
// };

// /**
//  * Check if device is a tablet
//  */
// export const isTablet = (): boolean => {
//   // Width/height greater than 600dp is generally considered a tablet
//   const pixelDensity = PixelRatio.get();
//   const adjustedWidth = SCREEN_WIDTH / pixelDensity;
//   const adjustedHeight = SCREEN_HEIGHT / pixelDensity;

//   const {width, height} = Dimensions.get('window');
//   const dpr = PixelRatio.get();

//   // iPad typically has width > 750 and height > 900 when in portrait orientation
//   // Also consider pixel ratio which is usually less than 2 for tablets
//   return (width > 750 || height > 900) && dpr <= 2;

//   //   return Math.max(adjustedWidth, adjustedHeight) >= 600;
// };

// /**
//  * Calculate responsive value based on device type
//  * @param phone - Value for phones
//  * @param tablet - Value for tablets
//  */
// export const deviceValue = <T>(phone: T, tablet: T): T => {
//   return isTablet() ? tablet : phone;
// };

// /**
//  * Listener for dimension changes (e.g., orientation changes)
//  * @param callback - Function to call when dimensions change
//  */
// export const addDimensionsListener = (
//   callback: (dimensions: {window: ScaledSize; screen: ScaledSize}) => void,
// ) => {
//   return Dimensions.addEventListener('change', callback);
// };
