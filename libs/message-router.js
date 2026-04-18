/**
 * Message router for Carbonlite service worker
 * Extracted from background.js (AC-P8-003)
 *
 * Handler registry pattern: registerHandler(type, fn)
 * Each message type maps to a single handler function.
 */

function createRouter() {
  const handlers = new Map();

  function registerHandler(type, fn) {
    handlers.set(type, fn);
  }

  /**
   * Dispatch a message to the registered handler.
   * @param {object} message - { type, ...payload }
   * @param {object} sender - Chrome sender info
   * @param {function} sendResponse - Chrome sendResponse callback
   * @returns {boolean|undefined} - true if async response expected
   */
  function dispatch(message, sender, sendResponse) {
    const handler = handlers.get(message.type);
    if (handler) {
      return handler(message, sender, sendResponse);
    }
    return undefined;
  }

  return { registerHandler, dispatch };
}

// Default router instance for convenience
const defaultRouter = createRouter();
const registerHandler = defaultRouter.registerHandler;

export { createRouter, registerHandler };
