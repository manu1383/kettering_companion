import {
    View,
    Text,
    StyleSheet,
    Pressable,
    useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { BUILDINGS, ROOM_INDEX , validateRoom} from "./maps/buildings";
import { useContainedImageLayout } from "./maps/useContainedImageLayout";

export default function MapScreen() {
    const generalKUMap = require("../../assets/images/KU_Updated_parking_Map_JAN2024-2.jpg");

    const insets = useSafeAreaInsets();
    const isDark = useColorScheme() === "dark";

    const theme = {
        arrow: isDark ? "#FFD700" : "#1E3A8A",
        arrowBg: isDark ? "#333" : "#E5E7EB",
        backBg: isDark ? "#222" : "#FFF",
        backText: isDark ? "#FFF" : "#1E3A8A",
    };
    //STFTODO redefine colors
    const params = useLocalSearchParams();
    const room = typeof params.room === "string" ? params.room : undefined;

    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
    const [floorIndex, setFloorIndex] = useState(0);

    const building = selectedBuilding ? BUILDINGS[selectedBuilding] : null;
    const floor = building?.floors[floorIndex];

    const campusLayout = useContainedImageLayout();
    const floorLayout = useContainedImageLayout();

    useEffect(() => {
        if (!room) return;

        const match = validateRoom(room);
        if (!match) return;

        setSelectedBuilding(match.buildingKey);
        setFloorIndex(match.floorIndex);
    }, [room]);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Text style={styles.title}>Map View</Text>

            {!selectedBuilding && (
                <View style={styles.mapContainer} onLayout={campusLayout.onContainerLayout}>
                    <Image
                        source={generalKUMap}
                        style={campusLayout.imageStyle}
                        contentFit="contain"
                        onLoad={campusLayout.onImageLoad}
                    />

                    {Object.entries(BUILDINGS).map(([key, b]) => (
                        <Pressable
                            key={key}
                            style={{
                                position: "absolute",
                                left:
                                    campusLayout.offsetX +
                                    b.campusLocation.x *
                                    campusLayout.displayWidth,
                                top:
                                    campusLayout.offsetY +
                                    b.campusLocation.y *
                                    campusLayout.displayHeight,
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

                    <View style={{ flex: 1 }} onLayout={floorLayout.onContainerLayout}>
                        <Image
                            source={floor.image}
                            style={floorLayout.imageStyle}
                            contentFit="contain"
                            onLoad={floorLayout.onImageLoad}
                        />

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
                                disabled={
                                    floorIndex === building.floors.length - 1
                                }
                                onPress={() =>
                                    setFloorIndex((f) =>
                                        Math.min(
                                            f + 1,
                                            building.floors.length - 1
                                        )
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