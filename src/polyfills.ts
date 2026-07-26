type IdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallback = (deadline: IdleCallbackDeadline) => void;

if (typeof window !== 'undefined') {
  if (typeof window.requestIdleCallback !== 'function') {
    window.requestIdleCallback = (callback) => {
      const start = Date.now();

      return window.setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
  }

  if (typeof window.cancelIdleCallback !== 'function') {
    window.cancelIdleCallback = (handle) => {
      window.clearTimeout(handle);
    };
  }
}

export {};