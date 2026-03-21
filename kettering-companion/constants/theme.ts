import { Platform, useColorScheme } from "react-native";

export const Colors = {
    light: {
        text: '#11181C',           // Primary text =dark gray
        background: '#FFFFFF',     // Main app background =white
        card: '#F4F6F8',           // Card / panel background =light gray
        border: '#DDDDDD',         // Borders / dividers subtle =gray

        tint: '#0B1F3A',           // Primary brand color =navy, buttons/highlights
        accent: '#0B1F3A',         // Accent color  =navy, emphasis elements

        icon: '#687076',           // Default icon color  =gray-blue
        tabIconDefault: '#687076', // inavtice tab
        tabIconSelected: '#0B1F3A',// Active tab icon color =navy

        modalBackground: '#FFFFFF',// Modal / popup background =white
    },

    dark: {
        text: '#F5F7FA',           // Primary text =soft white
        background: '#0B1F3A',     // Main background =deep navy
        card: '#13294B',           // Card / panel background =lighter navy
        border: '#1F3A5F',         // Borders / dividers =blue-gray

        tint: '#FFD100',           // Primary highlight =Kettering gold
        accent: '#FFD100',         // Accent color =gold for emphasis/buttons

        icon: '#AAB4C2',           // Default icon color =soft gray-blue
        tabIconDefault: '#AAB4C2', // Inactive tab 
        tabIconSelected: '#FFD100',// Active tab icon color =gold

        modalBackground: '#13294B',// Modal / popup background =lighter navy
    },
};

export function useTheme() {
    const scheme = useColorScheme() ?? "light";
    return Colors[scheme];
}

export const Fonts = Platform.select({
    ios: {
        sans: "system-ui",
        serif: "ui-serif",
        rounded: "ui-rounded",
        mono: "ui-monospace",
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace",
    },
});