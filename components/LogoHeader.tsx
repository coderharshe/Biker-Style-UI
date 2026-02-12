import { Image, View, StyleSheet, Platform, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LogoHeader() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) }]}>
            <View style={styles.headerRow}>
                <Image
                    source={require('@/assets/images/logo_moto.jpeg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.headerTitle}>MOTOSPHERE</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0B0B0B',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2228',
        zIndex: 100,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: {
        width: 60,
        height: 60,
    },
    headerTitle: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 22,
        color: '#FFF',
        letterSpacing: 2,
    },
});
