import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable z subtelnym efektem „wciśnięcia” (skala), używany w całej aplikacji.
 * Styl (w tym pozycjonowanie absolutne) trafia bezpośrednio na element dotykowy —
 * dzięki temu obszar dotyku zawsze pokrywa się z tym, co widać na ekranie.
 */
export function ScalePressable({ style, scaleTo = 0.97, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return (
    <AnimatedPressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(e) => {
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}
