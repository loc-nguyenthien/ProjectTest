import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  gestureHandlerRootHOC,
} from 'react-native-gesture-handler';
import styled from 'styled-components/native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Placeholder var
 */
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
/**
 * Placeholder var
 */

const DEFAULT_HEIGHT = SCREEN_HEIGHT / 2;

interface BottomSheetProps {
  width?: number;
  height?: number;
  containerStyle?: StyleProp<ViewStyle>;
  backdropColor?: string;
  show?: () => void;
  dismiss?: () => void;
  onShow?: () => void;
  onDismiss?: () => void;
  children?: React.ReactElement;
}

type BottomSheetIndicatorProps = {
  pan: Animated.Value;
  setPanValue: (value: number) => void;
  dismissAction: () => void;
};

export const BottomSheet = forwardRef<BottomSheetProps, any>(
  (
    {
      width = SCREEN_WIDTH,
      height = DEFAULT_HEIGHT,
      containerStyle,
      backdropColor = 'rgba(0, 0, 0, 0.2)',
      onShow,
      onDismiss,
      children,
    },
    ref,
  ) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const animation = useRef(new Animated.Value(0)).current;
    const pan = useRef(new Animated.Value(0)).current;
    const totalAnimation = Animated.add(animation, pan).interpolate({
      inputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
      outputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
    });

    const [visible, setVisible] = useState(false);

    const setPanValue = useCallback(
      (value: number) => pan.setValue(value),
      [pan],
    );

    const showBottomSheet = useMemo(
      () =>
        Animated.parallel([
          Animated.timing(animation, {
            toValue: -height,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      [animation, height, opacity],
    );
    const closeBottomSheet = useMemo(
      () =>
        Animated.parallel([
          Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      [animation, opacity],
    );

    const animationBackdrop = opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const dismissAction = useCallback(() => {
      closeBottomSheet.start(() => {
        setVisible(false);
        onDismiss?.();
      });
    }, [closeBottomSheet, onDismiss]);

    const showAction = useCallback(() => {
      setVisible(true);
      onShow?.();
    }, [onShow]);

    useEffect(() => {
      if (visible) {
        showBottomSheet.start();
      }
    }, [closeBottomSheet, showBottomSheet, visible]);

    useImperativeHandle(ref, () => ({
      show: showAction,
      dismiss: dismissAction,
    }));

    return (
      <Modal visible={visible} transparent animationType="none">
        <Container>
          <AnimatedTouchable
            onPress={dismissAction}
            activeOpacity={1}
            style={[
              styles.backdrop,
              {
                backgroundColor: backdropColor,
                opacity: animationBackdrop,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.container,
              {
                width,
                height: SCREEN_HEIGHT,
                top: SCREEN_HEIGHT,
                transform: [{translateY: totalAnimation}],
              },
              containerStyle,
            ]}>
            <BottomSheetIndicator
              pan={pan}
              setPanValue={setPanValue}
              dismissAction={dismissAction}
            />
            {children}
          </Animated.View>
        </Container>
      </Modal>
    );
  },
);

const BottomSheetIndicator = gestureHandlerRootHOC<BottomSheetIndicatorProps>(
  ({pan, setPanValue, dismissAction}) => {
    const panGesture = Gesture.Pan()
      .runOnJS(true)
      .onUpdate(e => {
        console.log('translationY', e.translationY, pan);
        setPanValue(e.translationY);
      })
      .onEnd(e => {
        if (e.absoluteY > SCREEN_HEIGHT * 0.8) {
          setTimeout(() => setPanValue(0), 300);
          return dismissAction();
        }
        Animated.timing(pan, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.indicator}>
          <View style={styles.indicatorIcon} />
        </View>
      </GestureDetector>
    );
  },
);

const Container = styled.View({
  position: 'relative',
  width: SCREEN_WIDTH,
  justifyContent: 'flex-end',
  backgroundColor: 'transparent',
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFF',
    zIndex: 999,
  },
  backdrop: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  indicator: {
    height: 40,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorIcon: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
});
