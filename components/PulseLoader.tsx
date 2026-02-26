import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/**
 * PulseLoader — Animated heartbeat/signal pulse loading screen.
 * 
 * Draws the signature ECG waveform (matching the app icon) left-to-right
 * using SVG stroke-dashoffset with Reanimated for smooth native performance,
 * then fades out and loops infinitely.
 * 
 * Shape: flat line → sharp peak up → deep valley → small bump → flat line
 */

const PULSE_COLOR = '#ec4899';
const DRAW_DURATION = 1500;

// SVG path that matches the icon's heartbeat waveform
// flat → peak up → deep valley → small bump up/down → flat
const PULSE_PATH = 'M 10,60 L 60,60 L 80,12 L 104,98 L 118,40 L 126,60 L 190,60';
const PATH_LENGTH = 380;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function PulseLoader() {
    const drawProgress = useSharedValue(0);
    const fadeOpacity = useSharedValue(1);

    useEffect(() => {
        // Animate the stroke drawing: 0 → 1 means fully drawn
        drawProgress.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }),              // reset
                withTiming(1, {                              // draw in
                    duration: DRAW_DURATION,
                    easing: Easing.out(Easing.quad),
                }),
                withDelay(600, withTiming(1, { duration: 0 })), // hold 600ms
            ),
            -1,
            false
        );

        // Animate the container fade: sync with draw cycle
        fadeOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 0 }),                       // visible
                withDelay(
                    DRAW_DURATION + 500,                              // wait for draw + hold
                    withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) })  // fade out
                ),
                withDelay(250, withTiming(1, { duration: 0 })),       // snap back visible
            ),
            -1,
            false
        );
    }, []);

    // Animate the SVG stroke-dashoffset (runs on UI thread)
    const animatedPathProps = useAnimatedProps(() => ({
        strokeDashoffset: PATH_LENGTH * (1 - drawProgress.value),
    }));

    // Animate the container opacity (runs on UI thread)
    const animatedFadeStyle = useAnimatedStyle(() => ({
        opacity: fadeOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.pulseWrapper, animatedFadeStyle]}>
                <Svg
                    width={220}
                    height={120}
                    viewBox="0 0 200 110"
                >
                    <AnimatedPath
                        d={PULSE_PATH}
                        stroke={PULSE_COLOR}
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={`${PATH_LENGTH}`}
                        animatedProps={animatedPathProps}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
