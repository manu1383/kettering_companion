import { View } from "react-native";
import { Image } from "expo-image";
import { BUILDINGS, ROOM_INDEX } from "./buildings";
import { useContainedImageLayout } from "./useContainedImageLayout";

type MiniMapProps = {
    room?: string;
};

export function MiniMap({ room }: MiniMapProps) {
    if (!room) return null;

    const normalized = room.toUpperCase().trim().replace(/\s+/g, "");

    const roomData = ROOM_INDEX[normalized];
    if (!roomData) return null;

    const building = BUILDINGS[roomData.buildingKey];
    const floor = building.floors[roomData.floorIndex];

    const layout = useContainedImageLayout();

    return (
        <View style={{ height: 250 }} onLayout={layout.onContainerLayout}>
            <Image
                source={floor.image}
                style={layout.imageStyle}
                contentFit="contain"
                onLoad={layout.onImageLoad}
            />

            {layout.displayWidth > 0 && (
                (() => {
                    const normalizedX = roomData.x / floor.imageWidth;
                    const normalizedY = 1 - (roomData.y / floor.imageHeight);

                    return (
                        <View
                            style={{
                                position: "absolute",
                                left:
                                    layout.offsetX +
                                    normalizedX * layout.displayWidth - 6,
                                top:
                                    layout.offsetY +
                                    normalizedY * layout.displayHeight - 6,
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: "red",
                            }}
                        />
                    );
                })()
            )}
        </View>
    );
} 