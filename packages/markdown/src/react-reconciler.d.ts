declare module "react-reconciler" {
  export default function Reconciler(hostConfig: Record<string, unknown>): {
    createContainer: (...args: unknown[]) => unknown;
    updateContainer: (...args: unknown[]) => unknown;
    updateContainerSync: (...args: unknown[]) => unknown;
    flushSyncWork: () => void;
  };
}

declare module "react-reconciler/constants" {
  export const DefaultEventPriority: number;
}
