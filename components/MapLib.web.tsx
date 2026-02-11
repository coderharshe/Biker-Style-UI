import { View, Text, StyleSheet } from 'react-native';

const MapView = (props: any) => {
    return (
        <View style={[styles.container, props.style]}>
            <Text style={styles.text}>Map not supported on Web Preview</Text>
            {props.children}
        </View>
    );
};

export const Marker = (props: any) => null;
export const Polyline = (props: any) => null;
export const PROVIDER_GOOGLE = 'google';
export type MapStyleElement = any;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E1E1E',
    },
    text: {
        color: '#888',
        fontSize: 14,
    },
});

export default MapView;
