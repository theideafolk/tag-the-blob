/**
 * Custom hook and store for managing keyboard controls state
 * Uses a simple store pattern to make controls accessible across components
 */
import { create } from 'zustand';
import { useGameStore } from '../store/gameStore';

// Define the shape of our controls state
interface ControlsState {
  keys: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    action: boolean;
  };
  setKey: (key: keyof ControlsState['keys'], value: boolean) => void;
  resetKeys: () => void;
}

// Create a store for the controls state
export const useControlsStore = create<ControlsState>((set) => ({
  keys: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    action: false,
  },
  setKey: (key, value) => 
    set((state) => ({
      keys: {
        ...state.keys,
        [key]: value,
      },
    })),
  resetKeys: () => 
    set({
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        action: false,
      },
    }),
}));

// Hook to access the controls state in components
export const useControls = () => {
  const { keys, setKey, resetKeys } = useControlsStore();
  const localPlayerId = useGameStore(state => state.localPlayerId);
  
  // Controls are only valid if there's a local player
  const validControls = !!localPlayerId;
  
  return { 
    keys: validControls ? keys : { forward: false, backward: false, left: false, right: false, action: false },
    setKey: validControls ? setKey : () => {}, 
    resetKeys
  };
};