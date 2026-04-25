type IdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleCallback = (deadline: IdleCallbackDeadline) => void;

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