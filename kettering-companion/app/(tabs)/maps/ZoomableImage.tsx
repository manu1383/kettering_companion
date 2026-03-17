import { View } from "react-native";
import { Image } from "expo-image";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect } from "react";

type Layout = {
    offsetX: number;
    offsetY: number;
    displayWidth: number;
    displayHeight: number;
    onContainerLayout: any;
    onImageLoad: any;
};

type Props = {
    source: any;
    layout: Layout;
    children?: React.ReactNode; // markers 
};

export default function ZoomableImage({ source, layout, children }: Props) {
    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    function clamp(value: number, min: number, max: number) {
        "worklet";
        return Math.min(Math.max(value, min), max);
    }

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const nextScale = savedScale.value * e.scale;
            scale.value = clamp(nextScale, 1, 4);
        })
        .onEnd(() => {
            savedScale.value = scale.value;

            if (scale.value <= 1) {
                scale.value = 1;
                savedScale.value = 1;
                translateX.value = 0;
                translateY.value = 0;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            }
        });

    const pan = Gesture.Pan()
        .minPointers(1)
        .maxPointers(1)
        .onUpdate((e) => {
            if (scale.value <= 1) return;
            if (!layout.displayWidth || !layout.displayHeight) return;

            const nextX = savedTranslateX.value + e.translationX;
            const nextY = savedTranslateY.value + e.translationY;

            const scaledWidth = layout.displayWidth * scale.value;
            const scaledHeight = layout.displayHeight * scale.value;

            const maxX = Math.max(0, (scaledWidth - layout.displayWidth) / 2);
            const maxY = Math.max(0, (scaledHeight - layout.displayHeight) / 2);

            translateX.value = clamp(nextX, -maxX, maxX);
            translateY.value = clamp(nextY, -maxY, maxY);
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composedGesture = Gesture.Simultaneous(pinch, pan);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    // Reset on image change
    useEffect(() => {
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    }, [source]);

    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            onLayout={layout.onContainerLayout}
        >
            {/* Only the actual image area should be interactive, needs testing on phone */}
            {layout.displayWidth > 0 && layout.displayHeight > 0 && (
                <View
                    style={{
                        width: layout.displayWidth,
                        height: layout.displayHeight,
                        overflow: "hidden",
                    }}
                >
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View
                            style={[
                                { width: "100%", height: "100%" },
                                animatedStyle,
                            ]}
                        >
                            {/* Image handling */}
                            <Image
                                source={source}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="contain"
                                onLoad={layout.onImageLoad}
                                pointerEvents="none"
                            />

                            {/* Marker handling */}
                            <View
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                }}
                                pointerEvents="none"
                            >
                                {children}
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            )}
        </View>
    );
} 