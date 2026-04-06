import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
    id: string;
    username: string;
    avatar_url?: string;
    bike_model?: string;
    xp: number;
    level: number;
}

interface AppState {
    profile: UserProfile | null;
    activeRideId: string | null;
    isOffline: boolean;
    
    // Actions
    setProfile: (profile: UserProfile | null) => void;
    setActiveRideId: (id: string | null) => void;
    setIsOffline: (status: boolean) => void;
    updateXP: (amount: number) => void;
}

/**
 * Global store for high-performance state management with Persistence.
 * This ensures that when a biker opens the app in a low-signal area,
 * their stats and active ride state are immediately visible.
 */
export const useStore = create<AppState>()(
    persist(
        (set: (state: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void) => ({
            profile: null,
            activeRideId: null,
            isOffline: false,

            setProfile: (profile: UserProfile | null) => set({ profile }),
            setActiveRideId: (id: string | null) => set({ activeRideId: id }),
            setIsOffline: (status: boolean) => set({ isOffline: status }),
            updateXP: (amount: number) => set((state: AppState) => ({
                profile: state.profile ? { ...state.profile, xp: state.profile.xp + amount } : null
            })),
        }),
        {
            name: 'motosphere-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
