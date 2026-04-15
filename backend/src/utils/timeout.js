export const withTimeout = (promiseFn, ms) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout after ${ms}ms`));
  }, ms);

  const timeoutPromise = new Promise((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
  });

  return Promise.race([
    promiseFn(controller.signal),
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};
