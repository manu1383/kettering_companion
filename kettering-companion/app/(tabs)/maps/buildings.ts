

export type RoomCoordinates = {
    x: number; // 0 = far left, 1 = far right
    y: number; // 0 = top, 1 = bottom
};

export type Floor = {
    level: number;
    image: any;
    rooms: Record<string, RoomCoordinates>;
};

export type Building = {
    name: string;
    campusLocation: { x: number; y: number };
    floors: Floor[];
};

export type BuildingsType = Record<string, Building>;

//
//  Building info
//

export const BUILDINGS: BuildingsType = {
    AB: {
        name: "Academic Building",
        campusLocation: { x: 0.45, y: 0.40 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/AcademicBuilding/Academic Building Level 1-page-00001.jpg"),
                rooms: {
                    AB101: { x: 0.32, y: 0.60 },
                    AB102: { x: 0.48, y: 0.60 },
                },
            },
            {
                level: 2,
                image: require("../../../assets/images/AcademicBuilding/Academic Building level 2-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/AcademicBuilding/Academic Building Level 3-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 4,
                image: require("../../../assets/images/AcademicBuilding/Academic Building Level 4-page-00001.jpg"),
                rooms: {},
            },
        ],
    },

    CC: {
        name: "Campus Center",
        campusLocation: { x: 0.60, y: 0.50 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/CampusCenter/Campus Center Level 1-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 2,
                image: require("../../../assets/images/CampusCenter/Campus Center Level 2-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/CampusCenter/Campus Center Level 3-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 4,
                image: require("../../../assets/images/CampusCenter/Campus Center Level 4-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 5,
                image: require("../../../assets/images/CampusCenter/Campus Center Level 5-page-00001.jpg"),
                rooms: {},
            },
        ],
    },

    LC: {
        name: "Learning Commons",
        campusLocation: { x: 0.35, y: 0.55 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/LearningCommons/KU_LC_LEVEL1-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 2,
                image: require("../../../assets/images/LearningCommons/KU_LC_LEVEL2_JAN24-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/LearningCommons/KU_LC_LEVEL3_JAN24-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 4,
                image: require("../../../assets/images/LearningCommons/KU_LC_LEVEL4-page-00001.jpg"),
                rooms: {},
            },
        ],
    },

    MC: {
        name: "Mott Center",
        campusLocation: { x: 0.70, y: 0.35 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/MottCenter/Mott Center Level 1-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 2,
                image: require("../../../assets/images/MottCenter/Mott Center Level 2-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/MottCenter/Mott Center Level 3-page-00001.jpg"),
                rooms: {},
            },
        ],
    },

    RH: {
        name: "Recreation Center",
        campusLocation: { x: 0.25, y: 0.30 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/RecreationCenter/Recreation Center Level 1-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 2,
                image: require("../../../assets/images/RecreationCenter/Recreation Center Level 2-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/RecreationCenter/Recreation Center Level 3-page-00001.jpg"),
                rooms: {},
            },
        ],
    },

    TH: {
        name: "Thompson Hall",
        campusLocation: { x: 0.50, y: 0.70 },
        floors: [
            {
                level: 1,
                image: require("../../../assets/images/ThompsonHall/ThompsonHallBasement-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 2,
                image: require("../../../assets/images/ThompsonHall/ThompsonHallLevel1-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 3,
                image: require("../../../assets/images/ThompsonHall/ThompsonHallLevel2-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 4,
                image: require("../../../assets/images/ThompsonHall/ThompsonHallLevel3-page-00001.jpg"),
                rooms: {},
            },
            {
                level: 5,
                image: require("../../../assets/images/ThompsonHall/ThompsonHallLevel4-page-00001.jpg"),
                rooms: {},
            },
        ],
    },
};
    //STFTODO can add rooms like this: rooms: {
    //AB201: { x: 0.4, y: 0.5 }
    //}
//
//Auto Create Room Index
// ex: AB101: { buildingKey: "AB", floorIndex: 0 },
//

export type RoomIndexType = Record<
    string,
    { buildingKey: string; floorIndex: number }
>;

export const ROOM_INDEX: RoomIndexType = {};

Object.entries(BUILDINGS).forEach(([buildingKey, building]) => {
    building.floors.forEach((floor, floorIndex) => {
        Object.keys(floor.rooms).forEach((roomKey) => {
            ROOM_INDEX[roomKey.toUpperCase()] = {
                buildingKey,
                floorIndex,
            };
        });
    });
});

export function extractBuildingPrefix(room: string): string | null {
    const match = room.toUpperCase().match(/^[A-Z]+/);
    return match ? match[0] : null;
}

//Ensure prefix for building and room exist
export function validateRoom(room: string) {
    const normalized = room.toUpperCase().trim();

    //Get building prefix
    const prefixMatch = normalized.match(/^[A-Z]+/);
    if (!prefixMatch) return null;

    const prefix = prefixMatch[0];
    const building = BUILDINGS[prefix];
    if (!building) return null;

    //Use exact room if exists
    if (ROOM_INDEX[normalized]) {
        return ROOM_INDEX[normalized];
    }

    //Else look for floor
    const numberMatch = normalized.match(/\d+/);
    if (!numberMatch) return null;

    const roomNumber = numberMatch[0];
    const firstDigit = parseInt(roomNumber.charAt(0), 10);

    if (isNaN(firstDigit)) return null;

    //Match floor
    const floorIndex = building.floors.findIndex(
        (floor) => floor.level === firstDigit
    );

    if (floorIndex === -1) return null;

    return {
        buildingKey: prefix,
        floorIndex,
    };
} 