import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone 11/12/13/14/15/16/17 Pro are similar in width)
// Base width 375 is standard for design tools like Figma
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Basic scaling
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Aliases
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

/**
 * Spacing Scale Helper
 * Define categories based on screen width:
 * - Compact: < 390pt (e.g., iPhone 16e, older SE models)
 * - Regular: 390pt - 430pt (e.g., iPhone 16, 16 Pro)
 * - Large: > 430pt (e.g., iPhone 16 Pro Max, 17 Pro Max)
 */
export const getSpacingMultiplier = () => {
    if (SCREEN_WIDTH < 390) return 0.95;
    if (SCREEN_WIDTH <= 430) return 1;
    return 1.1;
};

// Scalable spacing unit
export const spacing = (size: number) => scale(size) * getSpacingMultiplier();

/**
 * Responsive screen-edge padding
 * Scales gracefully: 16pt (compact) -> 20pt (regular) -> 24pt (large)
 */
export const screenPadding = SCREEN_WIDTH < 390 ? 16 : SCREEN_WIDTH <= 430 ? 20 : 24;

/**
 * Standard spacing tokens for consistency
 */
export const sp = {
    xs: spacing(4),
    s: spacing(8),
    m: spacing(16),
    l: spacing(24),
    xl: spacing(32),
    xxl: spacing(48),
};

// Responsive Font Size
export const fontSize = (size: number) => {
    const newSize = size * (SCREEN_WIDTH / guidelineBaseWidth);
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
};

export { SCREEN_HEIGHT, SCREEN_WIDTH };
