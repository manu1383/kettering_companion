import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../constants/theme";
import { BUILDINGS, ROOM_INDEX, validateRoom } from "./maps/buildings";
import { useContainedImageLayout } from "./maps/useContainedImageLayout";
import ZoomableImage from "./maps/ZoomableImage";

type Layout = ReturnType<typeof useContainedImageLayout>;

export default function MapScreen() {
    const generalKUMap = require("../../assets/images/KU_Updated_parking_Map_JAN2024-2.jpg");

    const insets = useSafeAreaInsets();
    const colors = useTheme();

    const theme = {
        arrow: colors.tabIconSelected,
        arrowBg: colors.card,
        backBg: colors.card,
        backText: colors.text,
    };

    const params = useLocalSearchParams();
    const room = typeof params.room === "string" ? params.room : undefined;

    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
    const [floorIndex, setFloorIndex] = useState(0);

    const building = selectedBuilding ? BUILDINGS[selectedBuilding] : null;
    const floor = building?.floors[floorIndex];

    const campusLayout = useContainedImageLayout();
    const floorLayout = useContainedImageLayout();

    const DEBUG_ROOMS = true;

    const roomKey = room ? room.toUpperCase().trim().replace(/\s+/g, "") : null;
    const roomData = roomKey ? ROOM_INDEX[roomKey] : null;
    const match = room ? validateRoom(room) : null;

    useEffect(() => {
        if (!match) return;

        setSelectedBuilding(match.buildingKey);
        setFloorIndex(match.floorIndex);
    }, [match]);

    function pixelRoomToScreen(
        layout: Layout,
        floor: 
        {
            imageWidth: number;
            imageHeight: number;
        },
        x: number,
        y: number
    ) {
        const normalizedX = x / floor.imageWidth;

        // Flip Y axis, y=0 starts @ top of image
        const normalizedY = 1 - (y / floor.imageHeight);

        return {
            left: normalizedX * layout.displayWidth,
            top: normalizedY * layout.displayHeight,
        };
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Text style={styles.title}>Map View</Text>

            {!selectedBuilding && (
                <View
                    style={styles.mapContainer}
                    onLayout={campusLayout.onContainerLayout}
                >
                    {/* Campus Map with oom handled inside component) */}
                    <ZoomableImage
                        source={generalKUMap}
                        layout={campusLayout}
                    />

                    {Object.entries(BUILDINGS).map(([key, b]) => (
                        <Pressable
                            key={key}
                            style={{
                                position: "absolute",
                                left:
                                    campusLayout.offsetX +
                                    b.campusLocation.x * campusLayout.displayWidth,
                                top:
                                    campusLayout.offsetY +
                                    b.campusLocation.y * campusLayout.displayHeight,
                            }}
                            onPress={() => {
                                setSelectedBuilding(key);
                                setFloorIndex(0);
                            }}
                        >
                            <Text style={{ fontSize: 24 }}>🏢</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {building && floor && (
                <View style={styles.mapContainer}>
                    <Pressable
                        onPress={() => setSelectedBuilding(null)}
                        style={[styles.backButton, { backgroundColor: theme.backBg }]}
                    >
                        <Text style={{ color: theme.backText }}>
                            ← Back to Campus Map
                        </Text>
                    </Pressable>

                    <View
                        style={{ flex: 1 }}
                        onLayout={floorLayout.onContainerLayout}
                    >
                        {/* Map and Markers */}
                        <ZoomableImage
                            source={floor.image}
                            layout={floorLayout}
                        >
                            {/* Red Star Room Marker */}
                            {roomData &&
                                match &&
                                selectedBuilding === match.buildingKey &&
                                floorIndex === match.floorIndex &&
                                (() => {

                                    const pos = pixelRoomToScreen(
                                        floorLayout,
                                        floor,
                                        roomData.x,
                                        roomData.y
                                    );

                                    return (
                                        <View
                                            style={{
                                                position: "absolute",
                                                ...pos,
                                                transform: [
                                                    { translateX: -16 },
                                                    { translateY: -16 },
                                                ],
                                            }}
                                        >
                                            <Ionicons name="star" size={32} color="red" />
                                        </View>
                                    );
                                })()}

                            {/* Debug room dots- useful for any map changes */}
                            {DEBUG_ROOMS &&
                                Object.entries(ROOM_INDEX).map(([key, r]) => {
                                    if (r.floorIndex !== floorIndex) return null;
                                    if (r.buildingKey !== selectedBuilding) return null;

                                    const pos = pixelRoomToScreen(
                                        floorLayout,
                                        floor,
                                        r.x,
                                        r.y
                                    );

                                    return (
                                        <View
                                            key={key}
                                            style={{
                                                position: "absolute",
                                                ...pos,
                                                transform: [
                                                    { translateX: -3 },
                                                    { translateY: -3 },
                                                ],
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: "cyan",
                                                }}
                                            />
                                        </View>
                                    );
                                })}
                        </ZoomableImage>

                        <View style={styles.floorControls}>
                            <Pressable
                                disabled={floorIndex === 0}
                                onPress={() =>
                                    setFloorIndex((f) => Math.max(f - 1, 0))
                                }
                            >
                                <Ionicons name="chevron-down" size={28} color={theme.arrow} />
                            </Pressable>

                            <Text>Floor {floor.level}</Text>

                            <Pressable
                                disabled={floorIndex === building.floors.length - 1}
                                onPress={() =>
                                    setFloorIndex((f) =>
                                        Math.min(f + 1, building.floors.length - 1)
                                    )
                                }
                            >
                                <Ionicons name="chevron-up" size={28} color={theme.arrow} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 10,
        textAlign: "center",
    },
    mapContainer: {
        flex: 1,
        position: "relative",
    },
    floorControls: {
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    backButton: {
        alignSelf: "flex-start",
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
});