import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { COLORS } from '@/utils/colors';

interface WaveAnimationProps {
  active: boolean;
  color?: string;
  mutedColor?: string;
  bars?: number;
}

export function WaveAnimation({
  active,
  color = COLORS.primary,
  mutedColor = COLORS.gray300,
  bars = 8,
}: WaveAnimationProps) {
  const valuesRef = useRef<Array<Animated.Value>>(
    Array.from({ length: bars }, () => new Animated.Value(0.25)),
  );

  const values = valuesRef.current;
  const indexes = useMemo(() => Array.from({ length: bars }, (_, index) => index), [bars]);
  const timeoutRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = [];

    if (!active) {
      values.forEach((value) => value.setValue(0.25));
      return () => {
        timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
        timeoutRefs.current = [];
      };
    }

    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 260 + index * 30,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.18,
            duration: 220 + index * 22,
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        try {
          animation.start();
        } catch {
          // ignore
        }
      }, index * 50);

      timeoutRefs.current.push(timeout);
    });

    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current = [];
      animations.forEach((animation) => {
        try {
          animation.stop();
        } catch {
          // ignore
        }
      });
    };
  }, [active, values]);

  return (
    <View style={styles.wrap}>
      {indexes.map((index) => {
        const height = values[index].interpolate({
          inputRange: [0, 1],
          outputRange: [8, index % 2 === 0 ? 34 : 28],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: index % 2 === 0 ? color : mutedColor,
                opacity: active ? 1 : 0.55,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    justifyContent: 'center',
    minWidth: 88,
  },
  bar: {
    width: 7,
    borderRadius: 999,
  },
});