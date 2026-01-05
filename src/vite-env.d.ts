/// <reference types="vite/client" />

// Declare virtual PWA module for TypeScript
declare module 'virtual:pwa-register/react' {
  
  
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PALM_BRIDGE_URL: string;
  readonly VITE_GEOAPIFY_API_KEY?: string; // Optional: for address autocomplete
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
