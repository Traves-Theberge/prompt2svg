/**
 * Zustand Store
 * 
 * Centralized state management for the prompt2svg application.
 * Uses the slices pattern for modular organization with TypeScript type safety.
 * 
 * @module store
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { StateCreator } from 'zustand';
import type {
  Model,
  ConsoleLog,
  GeneratedResult,
  SVGParameters,
  GenerationStatus,
  Theme,
} from './types';

// ============================================================================
// UI State Slice
// ============================================================================

/**
 * UI state interface.
 * Manages user interface state like theme, modals, and active tabs.
 */
export interface UIState {
  /** Current theme (light or dark) */
  theme: Theme;
  /** Whether a modal is currently open */
  isModalOpen: boolean;
  /** Currently selected tab identifier */
  selectedTab: string;
  /** Whether developer mode is enabled */
  devMode: boolean;
}

/**
 * UI actions interface.
 * Actions for manipulating UI state.
 */
export interface UIActions {
  /**
   * Sets the application theme.
   * @param theme - The theme to apply ('light' or 'dark')
   */
  setTheme: (theme: Theme) => void;
  
  /**
   * Toggles the modal open/closed state.
   */
  toggleModal: () => void;
  
  /**
   * Sets the active tab.
   * @param tab - The tab identifier to select
   */
  setSelectedTab: (tab: string) => void;

  /**
   * Toggles developer mode.
   */
  toggleDevMode: () => void;
}

/**
 * Combined UI slice type.
 */
export type UISlice = UIState & UIActions;

/**
 * Creates the UI state slice.
 * 
 * This slice manages user interface state that should persist across sessions.
 */
const createUISlice: StateCreator<
  UISlice & GenerationSlice & ModelsSlice,
  [],
  [],
  UISlice
> = (set) => ({
  // Initial state
  theme: 'light',
  isModalOpen: false,
  selectedTab: 'generate',
  devMode: false,
  
  // Actions
  setTheme: (theme) => set({ theme }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
});

// ============================================================================
// Generation State Slice
// ============================================================================

/**
 * Generation state interface.
 * Manages the SVG generation process state.
 */
export interface GenerationState {
  /** Current generation status */
  status: GenerationStatus;
  /** SVG generation parameters */
  parameters: SVGParameters;
  /** Console logs for the generation process */
  consoleLogs: ConsoleLog[];
  /** History of generated results */
  history: GeneratedResult[];
  /** Currently displayed SVG code */
  currentResult: string | null;
  /** Currently selected source icon */
  selectedIcon: string | null;
  /** Debug information for developer mode */
  debugData: {
    systemPrompt?: string;
    userPrompt?: string;
    rawResponse?: string;
    steps?: Array<{
      name: string;
      status: 'pending' | 'success' | 'error';
      timestamp: number;
      output?: string;
    }>;
  } | null;
}

/**
 * Generation actions interface.
 * Actions for managing generation state.
 */
export interface GenerationActions {
  /**
   * Updates the SVG generation parameters.
   * @param params - Partial parameters to update
   */
  setParameters: (params: Partial<SVGParameters>) => void;
  
  /**
   * Adds a new log entry to the console.
   * @param log - The log entry to add
   */
  addLog: (log: ConsoleLog) => void;
  
  /**
   * Clears all console logs.
   */
  clearLogs: () => void;
  
  /**
   * Adds a result to generation history.
   * @param result - The generated result to save
   */
  addToHistory: (result: GeneratedResult) => void;
  
  /**
   * Sets the current generation status.
   * @param status - The new status
   */
  setStatus: (status: GenerationStatus) => void;
  
  /**
   * Sets the currently displayed SVG result.
   * @param svg - The SVG code to display
   */
  setCurrentResult: (svg: string | null) => void;
  
  /**
   * Sets the selected source icon.
   * @param icon - The icon name
   */
  setSelectedIcon: (icon: string | null) => void;

  /**
   * Sets debug data.
   */
  setDebugData: (data: GenerationState['debugData']) => void;
}

/**
 * Combined generation slice type.
 */
export type GenerationSlice = GenerationState & GenerationActions;

/**
 * Creates the generation state slice.
 * 
 * This slice manages the entire SVG generation workflow.
 */
const createGenerationSlice: StateCreator<
  UISlice & GenerationSlice & ModelsSlice & PresetsSlice,
  [],
  [],
  GenerationSlice
> = (set) => ({
  // Initial state
  status: 'idle',
  parameters: {
    outlineWidth: 1.5,
    primaryColor: '#60A5FA',
  },
  consoleLogs: [],
  history: [],
  currentResult: null,
  selectedIcon: null,
  debugData: null,
  
  // Actions
  setParameters: (params) =>
    set((state) => ({
      parameters: { ...state.parameters, ...params },
    })),
  
  addLog: (log) =>
    set((state) => ({
      consoleLogs: [...state.consoleLogs, log],
    })),
  
  clearLogs: () => set({ consoleLogs: [] }),
  
  addToHistory: (result) =>
    set((state) => ({
      history: [result, ...state.history],
    })),
  
  setStatus: (status) => set({ status }),
  
  setCurrentResult: (svg) => set({ currentResult: svg }),
  
  setSelectedIcon: (icon) => set({ selectedIcon: icon }),

  setDebugData: (data) => set({ debugData: data }),
});

// ============================================================================
// Models State Slice
// ============================================================================

/**
 * Models state interface.
 * Manages AI models from OpenRouter.
 */
export interface ModelsState {
  /** Available AI models */
  models: Model[];
  /** Currently selected model ID */
  selectedModel: string | null;
  /** Whether models are being fetched */
  isLoading: boolean;
  /** Error message if models fetch failed */
  error: string | null;
}

/**
 * Models actions interface.
 * Actions for managing AI models.
 */
export interface ModelsActions {
  /**
   * Sets the list of available models.
   * @param models - Array of model objects
   */
  setModels: (models: Model[]) => void;
  
  /**
   * Selects an AI model by ID.
   * @param id - The model ID to select
   */
  selectModel: (id: string) => void;
  
  /**
   * Sets the loading state for model fetching.
   * @param loading - Whether models are being loaded
   */
  setLoading: (loading: boolean) => void;
  
  /**
   * Sets an error message for model fetching.
   * @param error - The error message (null to clear)
   */
  setError: (error: string | null) => void;
  
  /**
   * Fetches models from the API.
   * Async action that updates loading state and models.
   */
  fetchModels: () => Promise<void>;
}

/**
 * Combined models slice type.
 */
export type ModelsSlice = ModelsState & ModelsActions;

/**
 * Creates the models state slice.
 * 
 * This slice manages AI model selection and fetching.
 */
const createModelsSlice: StateCreator<
  UISlice & GenerationSlice & ModelsSlice & PresetsSlice,
  [],
  [],
  ModelsSlice
> = (set) => ({
  // Initial state
  models: [],
  selectedModel: null,
  isLoading: false,
  error: null,
  
  // Actions
  setModels: (models) => set({ models, error: null }),
  
  selectModel: (id) => set({ selectedModel: id }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  fetchModels: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/openrouter/models');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      set({ models: data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
    }
  },
});



// ============================================================================
// Store Creation and Configuration
// ============================================================================

/**
 * Combined store type with all slices.
 */
export type AppStore = UISlice & GenerationSlice & ModelsSlice;

/**
 * Main Zustand store hook.
 * 
 * Combines all slices and applies middleware:
 * - devtools: Redux DevTools integration for debugging
 * - persist: Persists UI preferences to localStorage
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const theme = useStore((state) => state.theme);
 *   const setTheme = useStore((state) => state.setTheme);
 *   
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export const useStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createGenerationSlice(...a),
        ...createModelsSlice(...a),
      }),
      {
        name: 'prompt2svg-storage',
        // Only persist UI preferences, not generation state
        partialize: (state) => ({
          theme: state.theme,
          selectedTab: state.selectedTab,
          parameters: state.parameters,
        }),
        storage: createJSONStorage(() => localStorage),
      }
    ),
    {
      name: 'prompt2svg',
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

const uiStoreSelector = (state: AppStore) => ({
  theme: state.theme,
  isModalOpen: state.isModalOpen,
  selectedTab: state.selectedTab,
  devMode: state.devMode,
  setTheme: state.setTheme,
  toggleModal: state.toggleModal,
  setSelectedTab: state.setSelectedTab,
  toggleDevMode: state.toggleDevMode,
});

/**
 * Hook for accessing UI state.
 * 
 * @example
 * ```tsx
 * const theme = useUIStore((state) => state.theme);
 * ```
 */
export const useUIStore = () => useStore(useShallow(uiStoreSelector));

const generationStoreSelector = (state: AppStore) => ({
  status: state.status,
  parameters: state.parameters,
  consoleLogs: state.consoleLogs,
  history: state.history,
  currentResult: state.currentResult,
  selectedIcon: state.selectedIcon,
  debugData: state.debugData,
  setParameters: state.setParameters,
  addLog: state.addLog,
  clearLogs: state.clearLogs,
  addToHistory: state.addToHistory,
  setStatus: state.setStatus,
  setCurrentResult: state.setCurrentResult,
  setSelectedIcon: state.setSelectedIcon,
  setDebugData: state.setDebugData,
});

/**
 * Hook for accessing generation state.
 * 
 * @example
 * ```tsx
 * const { status, parameters, addLog } = useGenerationStore();
 * ```
 */
export const useGenerationStore = () => useStore(useShallow(generationStoreSelector));

const modelsStoreSelector = (state: AppStore) => ({
  models: state.models,
  selectedModel: state.selectedModel,
  isLoading: state.isLoading,
  error: state.error,
  setModels: state.setModels,
  selectModel: state.selectModel,
  setLoading: state.setLoading,
  setError: state.setError,
  fetchModels: state.fetchModels,
});

/**
 * Hook for accessing models state.
 * 
 * @example
 * ```tsx
 * const { models, selectedModel, fetchModels } = useModelsStore();
 * ```
 */
export const useModelsStore = () => useStore(useShallow(modelsStoreSelector));
