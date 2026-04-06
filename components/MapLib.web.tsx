import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { MapContainer, TileLayer, Marker as LeafletMarker, Polyline as LeafletPolyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon paths in react environments
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

const MapView = (props: any) => {
    // Leaflet needs `center={[latitude, longitude]}` and `zoom`.
    let center: [number, number] = [34.1642, 77.5848];
    let zoom = 13;

    if (props.initialRegion) {
        center = [props.initialRegion.latitude, props.initialRegion.longitude];
        zoom = Math.round(Math.log(360 / props.initialRegion.latitudeDelta) / Math.LN2);
    }
    if (props.region) {
        center = [props.region.latitude, props.region.longitude];
    }
    
    // Safety check just in case this runs on SSR
    if (typeof window === 'undefined') return <View style={props.style} />;

    return (
        <View style={[styles.container, props.style]}>
            <MapContainer 
              center={center} 
              zoom={zoom} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; OSM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {props.children}
            </MapContainer>
        </View>
    );
};

export const Marker = (props: any) => {
    const { coordinate, title, children } = props;
    if (!coordinate || typeof window === 'undefined') return null;

    let isUser = false;
    let isSOS = false;
    
    if (children && children.props) {
        isUser = children.props.isUser || false;
        isSOS = children.props.isSOS || false;
    }

    let color = '#2b8a3e'; // Rider 
    if (isUser) color = '#3b82f6'; // Current user
    if (isSOS) color = '#ef4444'; // SOS
    if (title) color = '#eab308'; // Destination

    const html = `<div style="
        width: 16px; 
        height: 16px; 
        background: ${color}; 
        border-radius: 50%; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    "></div>`;

    const icon = L.divIcon({
        html: html,
        className: 'custom-leaflet-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    return (
        <LeafletMarker 
            position={[coordinate.latitude, coordinate.longitude]} 
            title={title}
            icon={icon} 
        />
    );
};

export const Polyline = (props: any) => {
    const { coordinates, strokeColor, strokeWidth, lineDashPattern } = props;
    if (!coordinates || typeof window === 'undefined') return null;

    const positions = coordinates.map((c: any) => [c.latitude, c.longitude]);
    const dashArray = lineDashPattern ? lineDashPattern.join(', ') : undefined;

    return (
        <LeafletPolyline 
            positions={positions} 
            pathOptions={{ color: strokeColor || '#000', weight: strokeWidth || 3, dashArray }} 
        />
    );
};

export const PROVIDER_GOOGLE = 'google';
export type MapStyleElement = any;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    }
});

export default MapView;

// Global CSS injection for custom leaf icons styling inside React Native Web
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
    @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    
    .custom-leaflet-marker {
      background: transparent;
      border: none;
    }
    .leaflet-container {
        font-family: inherit;
    }
    `;
    document.head.appendChild(styleEl);
}
