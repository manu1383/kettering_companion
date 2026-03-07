import { View } from "react-native";
import { Image } from "expo-image";
import { BUILDINGS } from "./buildings";
import { useContainedImageLayout } from "./useContainedImageLayout";

type MiniMapProps = {
    room?: string;
};

export function MiniMap({ room }: MiniMapProps) {
    if (!room) return null;

    const prefix = room.match(/^[A-Za-z]+/)?.[0]?.toUpperCase();
    if (!prefix) return null;

    const building = BUILDINGS[prefix];
    if (!building) return null;

    const floorNumber = parseInt(room.replace(/\D/g, "").charAt(0));
    let floorIndex = building.floors.findIndex(
        (f) => f.level === floorNumber
    );
    if (floorIndex === -1) floorIndex = 0;

    const floor = building.floors[floorIndex];
    const layout = useContainedImageLayout();

    const roomCoordinates = floor.rooms[room] ?? null;

    return (
        <View style={{ height: 250 }} onLayout={layout.onContainerLayout}>
            <Image
                source={floor.image}
                style={layout.imageStyle}
                contentFit="contain"
                onLoad={layout.onImageLoad}
            />

            {roomCoordinates && (
                <View
                    style={{
                        position: "absolute",
                        left:
                            layout.offsetX +
                            roomCoordinates.x * layout.displayWidth -
                            6,
                        top:
                            layout.offsetY +
                            roomCoordinates.y * layout.displayHeight -
                            6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "red",
                    }}
                />
            )}
        </View>
    );
} 