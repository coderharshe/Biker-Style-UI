import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import GlassCard from './GlassCard';

export interface Destination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const MOCK_DESTINATIONS: Destination[] = [
  { id: '1', name: 'Leh City Center', address: 'Main Bazar, Leh, Ladakh', latitude: 34.1642, longitude: 77.5848 },
  { id: '2', name: 'Khardung La Pass', address: 'Ladakh, India', latitude: 34.2787, longitude: 77.6047 },
  { id: '3', name: 'Pangong Lake', address: 'Lukung, Ladakh', latitude: 33.7595, longitude: 78.4384 },
  { id: '4', name: 'Nubra Valley', address: 'Diskit, Ladakh', latitude: 34.5428, longitude: 77.4244 },
];

interface DestinationPickerProps {
  onSelect: (dest: Destination) => void;
  onClose: () => void;
}

export default function DestinationPicker({ onSelect, onClose }: DestinationPickerProps) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(MOCK_DESTINATIONS);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFiltered(MOCK_DESTINATIONS);
      return;
    }
    const lower = text.toLowerCase();
    setFiltered(MOCK_DESTINATIONS.filter(d => 
      d.name.toLowerCase().includes(lower) || d.address.toLowerCase().includes(lower)
    ));
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Where to?</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={Colors.dark.accent} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search destination..."
            placeholderTextColor={Colors.dark.textTertiary}
            value={search}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable 
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.itemIconWrap}>
                <Feather name="map-pin" size={16} color={Colors.dark.accent} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAddress}>{item.address}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.dark.textTertiary} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
    zIndex: 100,
  },
  card: {
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 20,
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 16,
    color: Colors.dark.text,
  },
  list: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: Colors.dark.text,
  },
  itemAddress: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
    opacity: 0.5,
  },
});
