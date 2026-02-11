export interface Rider {
  id: string;
  name: string;
  avatar: string;
  bikeType: string;
  xp: number;
  level: number;
  totalKm: number;
  sosHelps: number;
  badges: string[];
  rank: number;
}

export interface GroupRide {
  id: string;
  name: string;
  leader: string;
  members: Rider[];
  distance: string;
  startTime: string;
  route: string;
  status: 'active' | 'upcoming' | 'completed';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  icon: string;
  category: 'daily' | 'weekly' | 'special';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export interface SOSHelper {
  id: string;
  name: string;
  distance: string;
  eta: string;
  bikeType: string;
}

export const currentUser: Rider = {
  id: '1',
  name: 'Ghost Rider',
  avatar: 'GR',
  bikeType: 'Sport',
  xp: 2450,
  level: 12,
  totalKm: 8750,
  sosHelps: 14,
  badges: ['road_warrior', 'night_owl', 'sos_hero', 'century_rider', 'explorer'],
  rank: 3,
};

export const riders: Rider[] = [
  { id: '2', name: 'Thunder', avatar: 'TH', bikeType: 'Cruiser', xp: 3200, level: 15, totalKm: 12400, sosHelps: 22, badges: ['road_warrior', 'night_owl', 'sos_hero', 'century_rider', 'explorer', 'group_lead'], rank: 1 },
  { id: '3', name: 'Viper', avatar: 'VP', bikeType: 'ADV', xp: 2800, level: 13, totalKm: 10200, sosHelps: 18, badges: ['road_warrior', 'sos_hero', 'century_rider', 'explorer'], rank: 2 },
  currentUser,
  { id: '4', name: 'Blaze', avatar: 'BZ', bikeType: 'Sport', xp: 2100, level: 11, totalKm: 7600, sosHelps: 9, badges: ['road_warrior', 'night_owl', 'century_rider'], rank: 4 },
  { id: '5', name: 'Phantom', avatar: 'PH', bikeType: 'Touring', xp: 1950, level: 10, totalKm: 6800, sosHelps: 7, badges: ['road_warrior', 'century_rider'], rank: 5 },
  { id: '6', name: 'Hawk', avatar: 'HK', bikeType: 'ADV', xp: 1700, level: 9, totalKm: 5500, sosHelps: 5, badges: ['road_warrior'], rank: 6 },
  { id: '7', name: 'Storm', avatar: 'ST', bikeType: 'Cruiser', xp: 1400, level: 8, totalKm: 4200, sosHelps: 3, badges: ['road_warrior'], rank: 7 },
  { id: '8', name: 'Bolt', avatar: 'BT', bikeType: 'Sport', xp: 1100, level: 7, totalKm: 3100, sosHelps: 2, badges: [], rank: 8 },
  { id: '9', name: 'Ace', avatar: 'AC', bikeType: 'Touring', xp: 900, level: 6, totalKm: 2400, sosHelps: 1, badges: [], rank: 9 },
  { id: '10', name: 'Nitro', avatar: 'NT', bikeType: 'Sport', xp: 650, level: 5, totalKm: 1800, sosHelps: 0, badges: [], rank: 10 },
];

export const groupRides: GroupRide[] = [
  {
    id: '1',
    name: 'Sunset Highway Run',
    leader: 'Thunder',
    members: [riders[0], riders[1], riders[3]],
    distance: '85 km',
    startTime: '6:00 PM Today',
    route: 'Coast Highway Loop',
    status: 'active',
  },
  {
    id: '2',
    name: 'Mountain Pass Rally',
    leader: 'Viper',
    members: [riders[1], riders[4], riders[5]],
    distance: '120 km',
    startTime: '8:00 AM Tomorrow',
    route: 'Alpine Ridge Trail',
    status: 'upcoming',
  },
  {
    id: '3',
    name: 'Night Cruise',
    leader: 'Ghost Rider',
    members: [riders[2], riders[3], riders[6]],
    distance: '45 km',
    startTime: '10:00 PM Tonight',
    route: 'City Loop',
    status: 'upcoming',
  },
  {
    id: '4',
    name: 'Canyon Express',
    leader: 'Blaze',
    members: [riders[3], riders[7]],
    distance: '65 km',
    startTime: 'Yesterday',
    route: 'Red Canyon Road',
    status: 'completed',
  },
];

export const tasks: Task[] = [
  { id: '1', title: 'Visit Hidden Location', description: 'Discover a secret checkpoint on the map', xpReward: 150, completed: false, icon: 'map-pin', category: 'daily' },
  { id: '2', title: 'Help Rider via SOS', description: 'Respond to an emergency alert nearby', xpReward: 300, completed: true, icon: 'shield', category: 'daily' },
  { id: '3', title: 'Ride 100 KM', description: 'Complete a century ride in one session', xpReward: 500, completed: false, icon: 'navigation', category: 'weekly' },
  { id: '4', title: 'Night Ride Challenge', description: 'Complete a ride between 10 PM and 4 AM', xpReward: 250, completed: false, icon: 'moon', category: 'daily' },
  { id: '5', title: 'Group Ride Leader', description: 'Lead a group ride with 3+ members', xpReward: 200, completed: true, icon: 'users', category: 'weekly' },
  { id: '6', title: 'Speed Demon', description: 'Maintain 80+ km/h average for 30 min', xpReward: 350, completed: false, icon: 'zap', category: 'special' },
  { id: '7', title: 'Trail Blazer', description: 'Ride a route nobody has taken before', xpReward: 400, completed: false, icon: 'compass', category: 'special' },
];

export const badges: Badge[] = [
  { id: 'road_warrior', name: 'Road Warrior', icon: 'award', earned: true, description: 'Ride 1000+ km total' },
  { id: 'night_owl', name: 'Night Owl', icon: 'moon', earned: true, description: 'Complete 5 night rides' },
  { id: 'sos_hero', name: 'SOS Hero', icon: 'shield', earned: true, description: 'Help 10 riders via SOS' },
  { id: 'century_rider', name: 'Century Rider', icon: 'trending-up', earned: true, description: 'Complete a 100 km ride' },
  { id: 'explorer', name: 'Explorer', icon: 'compass', earned: true, description: 'Visit 20 locations' },
  { id: 'group_lead', name: 'Pack Leader', icon: 'users', earned: false, description: 'Lead 10 group rides' },
  { id: 'iron_horse', name: 'Iron Horse', icon: 'zap', earned: false, description: 'Ride 500 km in one week' },
  { id: 'guardian', name: 'Guardian', icon: 'heart', earned: false, description: 'Help 50 riders via SOS' },
];

export const chatMessages: ChatMessage[] = [
  { id: '1', sender: 'Thunder', text: 'Everyone ready for the sunset run?', time: '5:42 PM' },
  { id: '2', sender: 'Viper', text: 'Gassed up and ready to roll', time: '5:43 PM' },
  { id: '3', sender: 'Ghost Rider', text: 'On my way to the meetup point', time: '5:45 PM' },
  { id: '4', sender: 'Blaze', text: 'Weather looks perfect tonight', time: '5:46 PM' },
  { id: '5', sender: 'Thunder', text: 'Meet at the gas station on Route 66', time: '5:48 PM' },
];

export const sosHelpers: SOSHelper[] = [
  { id: '1', name: 'Thunder', distance: '1.2 km', eta: '3 min', bikeType: 'Cruiser' },
  { id: '2', name: 'Viper', distance: '2.5 km', eta: '5 min', bikeType: 'ADV' },
  { id: '3', name: 'Blaze', distance: '3.8 km', eta: '8 min', bikeType: 'Sport' },
  { id: '4', name: 'Hawk', distance: '5.1 km', eta: '12 min', bikeType: 'ADV' },
];

export const weatherData = {
  temp: '24',
  condition: 'Clear',
  wind: '12 km/h',
  humidity: '45%',
  icon: 'sun',
};
