import { DefaultEventPriority } from "react-reconciler/constants";

// Boilerplate shared by the content and template reconciler host
// configs. The two configs differ only in createInstance,
// createTextInstance, append*, insertBefore, removeChild,
// clearContainer, commitTextUpdate, and resetTextContent — everything
// else (lifecycle hooks, priority/scheduling, no-op stubs) is
// identical.
//
// Consumers spread the returned object and override the methods they
// own. The `scope` string flows into rendererPackageName and the
// HostContext so React DevTools / error messages stay distinguishable.
export function createReconcilerHostConfigBase(scope: string): ReconcilerHostConfigBase {
  return {
    rendererPackageName: `reactdoc-${scope}`,
    rendererVersion: "0.0.0",
    supportsMutation: true,
    isPrimaryRenderer: false,
    supportsPersistence: false,
    supportsHydration: false,
    supportsMicrotasks: true,
    noTimeout: -1,
    warnsIfNotActing: false,
    now: Date.now,
    getRootHostContext: () => ({ scope }),
    getChildHostContext: (parentHostContext: HostContextShape) => parentHostContext,
    prepareForCommit: () => null,
    resetAfterCommit: () => {},
    preparePortalMount: () => {},
    finalizeInitialChildren: () => false,
    shouldSetTextContent: () => false,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    scheduleMicrotask: queueMicrotask,
    setCurrentUpdatePriority: () => {},
    getCurrentUpdatePriority: () => DefaultEventPriority,
    resolveUpdatePriority: () => DefaultEventPriority,
    getCurrentEventPriority: () => DefaultEventPriority,
    commitUpdate: () => {},
    prepareUpdate: () => null,
    hideInstance: () => {},
    hideTextInstance: () => {},
    unhideInstance: () => {},
    unhideTextInstance: () => {},
    maySuspendCommit: () => false,
    detachDeletedInstance: () => {}
  };
}

type HostContextShape = { scope: string };

type ReconcilerHostConfigBase = {
  rendererPackageName: string;
  rendererVersion: string;
  supportsMutation: true;
  isPrimaryRenderer: false;
  supportsPersistence: false;
  supportsHydration: false;
  supportsMicrotasks: true;
  noTimeout: -1;
  warnsIfNotActing: false;
  now: () => number;
  getRootHostContext: () => HostContextShape;
  getChildHostContext: (parentHostContext: HostContextShape) => HostContextShape;
  prepareForCommit: () => null;
  resetAfterCommit: () => void;
  preparePortalMount: () => void;
  finalizeInitialChildren: () => false;
  shouldSetTextContent: () => false;
  scheduleTimeout: typeof setTimeout;
  cancelTimeout: typeof clearTimeout;
  scheduleMicrotask: typeof queueMicrotask;
  setCurrentUpdatePriority: () => void;
  getCurrentUpdatePriority: () => number;
  resolveUpdatePriority: () => number;
  getCurrentEventPriority: () => number;
  commitUpdate: () => void;
  prepareUpdate: () => null;
  hideInstance: () => void;
  hideTextInstance: () => void;
  unhideInstance: () => void;
  unhideTextInstance: () => void;
  maySuspendCommit: () => false;
  detachDeletedInstance: () => void;
};
