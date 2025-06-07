// // utils/responsive.ts
// import {Dimensions, Platform, PixelRatio} from 'react-native';

// interface ImageSize {
//   width: number;
//   height: number;
// }

// interface ShadowStyle {
//   shadowColor?: string;
//   shadowOffset?: {width: number; height: number};
//   shadowOpacity?: number;
//   shadowRadius?: number;
//   elevation?: number;
// }

// interface SafeAreaPadding {
//   paddingTop: number;
//   paddingBottom: number;
// }

// interface CommonStyles {
//   container: object;
//   contentPadding: object;
//   searchContainer: object;
//   searchInput: object;
//   cardContainer: object;
//   headingText: object;
//   bodyText: object;
//   smallText: object;
//   largeText: object;
//   buttonText: object;
//   iconContainer: object;
//   button: object;
//   card: object;
//   inputContainer: object;
// }

// class ResponsiveScreen {
//   public screenWidth: number;
//   public screenHeight: number;
//   public isLandscape: boolean;
//   public isTablet: boolean;
//   public isPhone: boolean;
//   public pixelRatio: number;
//   public isIOS: boolean;
//   public isAndroid: boolean;
//   public isSmallPhone: boolean;
//   public isMediumPhone: boolean;
//   public isLargePhone: boolean;
//   public isSmallTablet: boolean;
//   public isLargeTablet: boolean;

//   constructor() {
//     const {width, height} = Dimensions.get('window');
//     this.screenWidth = width;
//     this.screenHeight = height;
//     this.isLandscape = width > height;
//     this.isTablet = width >= 768;
//     this.isPhone = width < 768;
//     this.pixelRatio = PixelRatio.get();

//     // Device type detection
//     this.isIOS = Platform.OS === 'ios';
//     this.isAndroid = Platform.OS === 'android';

//     // Screen categories
//     this.isSmallPhone = width <= 360;
//     this.isMediumPhone = width > 360 && width < 414;
//     this.isLargePhone = width >= 414 && width < 768;
//     this.isSmallTablet = width >= 768 && width < 1024;
//     this.isLargeTablet = width >= 1024;
//   }

//   // Update dimensions on orientation change
//   public updateDimensions(): void {
//     const {width, height} = Dimensions.get('window');
//     this.screenWidth = width;
//     this.screenHeight = height;
//     this.isLandscape = width > height;
//   }

//   // Responsive width based on percentage
//   public wp(percentage: number): number {
//     return (this.screenWidth * percentage) / 100;
//   }

//   // Responsive height based on percentage
//   public hp(percentage: number): number {
//     return (this.screenHeight * percentage) / 100;
//   }

//   // Responsive font size
//   public fontSize(size: number): number {
//     if (this.isTablet) {
//       return size * 1.2; // 20% larger on tablets
//     }
//     if (this.isSmallPhone) {
//       return size * 0.9; // 10% smaller on small phones
//     }
//     return size;
//   }

//   // Responsive spacing
//   public spacing(size: number): number {
//     if (this.isTablet) {
//       return size * 1.5; // 50% more spacing on tablets
//     }
//     if (this.isSmallPhone) {
//       return size * 0.8; // 20% less spacing on small phones
//     }
//     return size;
//   }

//   // Container width for centered content
//   public getContainerWidth(): number {
//     if (this.isTablet) {
//       return this.isLandscape ? this.screenWidth * 0.8 : this.screenWidth * 0.9;
//     }
//     return this.screenWidth;
//   }

//   // Card dimensions
//   public getCardWidth(
//     columns: number = 2,
//     margin: number = 20,
//     padding: number = 40,
//   ): number {
//     const containerWidth = this.getContainerWidth();
//     const totalMargin = margin * (columns - 1);
//     return (containerWidth - padding - totalMargin) / columns;
//   }

//   // Grid columns based on device
//   public getGridColumns(
//     phoneColumns: number = 2,
//     tabletPortraitColumns: number = 3,
//     tabletLandscapeColumns: number = 4,
//   ): number {
//     if (this.isTablet) {
//       return this.isLandscape ? tabletLandscapeColumns : tabletPortraitColumns;
//     }
//     return phoneColumns;
//   }

//   // Icon size
//   public getIconSize(baseSize: number = 24): number {
//     if (this.isTablet) {
//       return baseSize * 1.3;
//     }
//     return baseSize;
//   }

//   // Button height
//   public getButtonHeight(baseHeight: number = 40): number {
//     if (this.isTablet) {
//       return baseHeight * 1.25;
//     }
//     return baseHeight;
//   }

//   // Content padding
//   public getContentPadding(basePadding: number = 20): number {
//     if (this.isTablet) {
//       return this.screenWidth * 0.05; // 5% of screen width
//     }
//     return basePadding;
//   }

//   // Maximum content width (prevents stretching on large screens)
//   public getMaxContentWidth(): number {
//     if (this.isLargeTablet) {
//       return 1200; // Max width for very large tablets
//     }
//     if (this.isTablet) {
//       return 800;
//     }
//     return this.screenWidth;
//   }

//   // Responsive border radius
//   public getBorderRadius(baseRadius: number = 8): number {
//     if (this.isTablet) {
//       return baseRadius * 1.2;
//     }
//     return baseRadius;
//   }

//   // Image dimensions
//   public getImageSize(baseWidth: number, baseHeight: number): ImageSize {
//     const multiplier = this.isTablet ? 1.3 : 1;
//     return {
//       width: baseWidth * multiplier,
//       height: baseHeight * multiplier,
//     };
//   }

//   // Common styles that can be reused
//   public getCommonStyles(): CommonStyles {
//     return {
//       // Container styles
//       container: {
//         flex: 1,
//         maxWidth: this.getMaxContentWidth(),
//         alignSelf: 'center',
//         width: '100%',
//       },

//       // Content padding
//       contentPadding: {
//         paddingHorizontal: this.getContentPadding(),
//       },

//       // Search container
//       searchContainer: {
//         paddingHorizontal: this.getContentPadding(),
//         paddingVertical: this.spacing(12),
//         width: '100%',
//         alignSelf: 'center',
//       },

//       // Search input
//       searchInput: {
//         height: this.getButtonHeight(),
//         fontSize: this.fontSize(14),
//         paddingHorizontal: this.spacing(15),
//       },

//       // Card container
//       cardContainer: {
//         paddingHorizontal: this.getContentPadding() * 0.5,
//         paddingBottom: this.spacing(10),
//         alignSelf: 'center',
//         width: '100%',
//         maxWidth: this.getContainerWidth(),
//       },

//       // Heading text
//       headingText: {
//         fontSize: this.fontSize(20),
//         fontWeight: 'bold' as const,
//       },

//       // Body text
//       bodyText: {
//         fontSize: this.fontSize(14),
//       },

//       // Small text
//       smallText: {
//         fontSize: this.fontSize(12),
//       },

//       // Large text
//       largeText: {
//         fontSize: this.fontSize(18),
//       },

//       // Button text
//       buttonText: {
//         fontSize: this.fontSize(16),
//         fontWeight: '600' as const,
//       },

//       // Icon container
//       iconContainer: {
//         width: this.getIconSize() + this.spacing(8),
//         height: this.getIconSize() + this.spacing(8),
//         justifyContent: 'center' as const,
//         alignItems: 'center' as const,
//       },

//       // Common button
//       button: {
//         height: this.getButtonHeight(),
//         borderRadius: this.getBorderRadius(),
//         paddingHorizontal: this.spacing(16),
//         justifyContent: 'center' as const,
//         alignItems: 'center' as const,
//       },

//       // Card style
//       card: {
//         backgroundColor: '#fff',
//         borderRadius: this.getBorderRadius(10),
//         padding: this.spacing(8),
//         margin: this.spacing(5),
//         borderWidth: 1,
//         borderColor: '#ddd',
//         ...this.getShadowStyle(),
//       },

//       // Input container
//       inputContainer: {
//         flexDirection: 'row' as const,
//         alignItems: 'center' as const,
//         backgroundColor: '#fff',
//         borderRadius: this.getBorderRadius(20),
//         borderWidth: 1,
//         borderColor: '#777',
//         paddingRight: this.spacing(7),
//         maxWidth: this.isTablet ? 600 : '100%',
//         alignSelf: 'center' as const,
//       },
//     };
//   }

//   // Shadow styles for different platforms
//   public getShadowStyle(elevation: number = 3): ShadowStyle {
//     if (this.isIOS) {
//       return {
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       };
//     } else {
//       return {
//         elevation: elevation,
//       };
//     }
//   }

//   // Responsive values for specific use cases
//   public getResponsiveValue<T>(phoneValue: T, tabletValue: T): T {
//     return this.isTablet ? tabletValue : phoneValue;
//   }

//   // Layout helpers
//   public getFlexDirection(): 'row' | 'column' {
//     return this.isTablet && this.isLandscape ? 'row' : 'column';
//   }

//   // Safe area padding
//   public getSafeAreaPadding(): SafeAreaPadding {
//     return {
//       paddingTop: this.isIOS ? (this.isTablet ? 20 : 44) : 0,
//       paddingBottom: this.isIOS && !this.isTablet ? 34 : 0,
//     };
//   }
// }

// // Create singleton instance
// const responsive = new ResponsiveScreen();

// // Listen for orientation changes
// const updateResponsive = (): void => {
//   responsive.updateDimensions();
// };

// // Note: In newer React Native versions, use this instead:
// // const subscription = Dimensions.addEventListener('change', updateResponsive);
// // To remove listener: subscription?.remove();

// const dimensionsSubscription = Dimensions.addEventListener(
//   'change',
//   updateResponsive,
// );

// export default responsive;

// // Export specific utilities for convenience
// export const {
//   wp,
//   hp,
//   fontSize,
//   spacing,
//   getContainerWidth,
//   getCardWidth,
//   getGridColumns,
//   getIconSize,
//   getButtonHeight,
//   getContentPadding,
//   getMaxContentWidth,
//   getBorderRadius,
//   getImageSize,
//   getCommonStyles,
//   getShadowStyle,
//   getResponsiveValue,
//   getFlexDirection,
//   getSafeAreaPadding,
//   isTablet,
//   isPhone,
//   isLandscape,
//   screenWidth,
//   screenHeight,
// } = responsive;

// // Export the subscription for cleanup if needed
// export {dimensionsSubscription};

// utils/responsive.js
import {Dimensions, PixelRatio, Platform} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Device type detection
const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else {
    return (
      (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
      (SCREEN_WIDTH >= 1024 && SCREEN_HEIGHT >= 768)
    );
  }
};

const isSmallDevice = () => SCREEN_WIDTH < 375;
const isLargeDevice = () => SCREEN_WIDTH > 414;

// Responsive scaling functions
export const scale = size => {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  return size * ratio;
};

export const verticalScale = size => {
  const ratio = SCREEN_HEIGHT / BASE_HEIGHT;
  return size * ratio;
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Font scaling with device-specific adjustments
export const responsiveFontSize = fontSize => {
  if (isTablet()) {
    return moderateScale(fontSize, 0.3);
  } else if (isSmallDevice()) {
    return moderateScale(fontSize, 0.2);
  } else if (isLargeDevice()) {
    return moderateScale(fontSize, 0.4);
  }
  return moderateScale(fontSize);
};

// Responsive dimensions
export const responsiveWidth = percentage => {
  return (percentage * SCREEN_WIDTH) / 100;
};

export const responsiveHeight = percentage => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

// Device info
export const deviceInfo = {
  isTablet: isTablet(),
  isSmallDevice: isSmallDevice(),
  isLargeDevice: isLargeDevice(),
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

// Grid system for different devices
export const getGridColumns = () => {
  if (isTablet()) {
    return SCREEN_WIDTH > SCREEN_HEIGHT ? 4 : 3; // Landscape : Portrait
  }
  return 2; // Phone
};

// Spacing system
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

// Component-specific responsive helpers
export const cardDimensions = {
  width: isTablet()
    ? (SCREEN_WIDTH - spacing.md * (getGridColumns() + 1)) / getGridColumns()
    : (SCREEN_WIDTH - 40) / 2,
  minHeight: isTablet() ? scale(180) : scale(150),
};

export const searchBarHeight = isTablet() ? scale(48) : scale(40);

// Export device info for conditional rendering
export {isTablet, isSmallDevice, isLargeDevice};
