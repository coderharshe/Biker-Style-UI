import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface MapMarkerProps {
    position: { top: number; left: number };
    isUser?: boolean;
    isSOS?: boolean;
    index: number;
}

export default function MapMarker({ position, isUser, isSOS, index }: MapMarkerProps) {
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const pulse = useSharedValue(1);
    const pulseOp = useSharedValue(0.6);

    useEffect(() => {
        if (isUser) {
            pulse.value = withRepeat(
                withTiming(1.8, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
            pulseOp.value = withRepeat(
                withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
        } else if (isSOS) {
            pulse.value = withRepeat(
                withSequence(withTiming(1.5, { duration: 600 }), withTiming(1, { duration: 600 })),
                -1,
                false
            );
            pulseOp.value = withRepeat(
                withSequence(withTiming(0.8, { duration: 600 }), withTiming(0.2, { duration: 600 })),
                -1,
                false
            );
        } else {
            offsetX.value = withRepeat(
                withDelay(
                    index * 400,
                    withSequence(
                        withTiming(Math.random() * 6 - 3, {
                            duration: 3000 + index * 500,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        withTiming(Math.random() * 6 - 3, {
                            duration: 3000 + index * 500,
                            easing: Easing.inOut(Easing.ease),
                        })
                    )
                ),
                -1,
                true
            );
            offsetY.value = withRepeat(
                withDelay(
                    index * 300,
                    withSequence(
                        withTiming(Math.random() * 6 - 3, {
                            duration: 2500 + index * 600,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        withTiming(Math.random() * 6 - 3, {
                            duration: 2500 + index * 600,
                            easing: Easing.inOut(Easing.ease),
                        })
                    )
                ),
                -1,
                true
            );
        }
    }, []);

    const markerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: pulseOp.value,
    }));

    const dotColor = isUser ? Colors.dark.secondary : isSOS ? Colors.dark.sos : Colors.dark.accent;
    const dotSize = isUser ? 14 : isSOS ? 12 : 10;

    return (
        <Animated.View
            style={[
                styles.mapMarker,
                { top: `${position.top}%`, left: `${position.left}%` },
                markerStyle,
            ]}
        >
            {(isUser || isSOS) && (
                <Animated.View
                    style={[
                        styles.markerPulseRing,
                        {
                            width: dotSize * 2.5,
                            height: dotSize * 2.5,
                            borderRadius: dotSize * 1.25,
                            backgroundColor: dotColor + '40',
                        },
                        pulseStyle,
                    ]}
                />
            )}
            <View
                style={[
                    styles.markerDot,
                    {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: dotColor,
                    },
                    isUser && styles.markerGlow,
                    isSOS && styles.markerSOSGlow,
                ]}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    mapMarker: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    markerDot: {
        borderWidth: 2,
        borderColor: '#0D1117',
        zIndex: 2,
    },
    markerGlow: {
        shadowColor: Colors.dark.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    markerSOSGlow: {
        shadowColor: Colors.dark.sos,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    markerPulseRing: {
        position: 'absolute',
        zIndex: 1,
    },
});
