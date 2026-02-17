import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';//recommended by documentation, not sure why. STFTODO

export default function MapScreen() {

    const generalKUMap = require('../../assets/images/KU_Updated_parking_Map_JAN2024-2.jpg')
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Map View</Text>
            <Image
                style={styles.image}
                source={generalKUMap} 
                contentFit="cover" // Optional resize control
                transition={1000} //Optional tansition
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    image: {
        width: '90%',  // Set a specific width
        height: '95%', // Set a specific height
    },
});

