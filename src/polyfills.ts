type IdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallbackHandle = ReturnType<typeof window.setTimeout>;
type IdleCallback = (deadline: IdleCallbackDeadline) => void;

declare global {
  interface Window {
    requestIdleCallback?: (
      callback: IdleCallback,
      options?: { timeout?: number }
    ) => IdleCallbackHandle;
    cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
  }
}

if (typeof window !== 'undefined') {
  window.requestIdleCallback ??= (callback) => {
    const start = Date.now();

    return window.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  };

  window.cancelIdleCallback ??= (handle) => {
    window.clearTimeout(handle);
  };
}

export {};