export default class EventBus {
  static listeners = {};

  /**
   * The callback receives `event.detail`, not the event.
   */
  static on(event, callback) {
    document.addEventListener(event, (e) => {
      callback(e.detail);
    });
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  static emit(event, data) {
    document.dispatchEvent(
      new CustomEvent(event, {
        detail: data,
      }),
    );
  }

  static off(event, callback) {
    document.removeEventListener(event, callback);
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((listener) => listener !== callback);
    }
  }

  static once(event, callback) {
    const listener = (e) => {
      callback(e.detail);
      this.off(event, listener);
    };
    document.addEventListener(event, listener);
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push({ callback, listener });
  }

  /**
   * Runs before bubbling listeners by registering in the capture phase.
   */
  static prepend(event, callback) {
    const listener = (e) => {
      callback(e.detail);
    };
    document.addEventListener(
      event,
      listener,
      true, // set `useCapture` to `true` to insert the listener at the beginning
    );
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].unshift({ callback, listener });
  }

  static prependOnce(event, callback) {
    const listener = (e) => {
      callback(e.detail);
      this.off(event, listener);
    };
    document.addEventListener(
      event,
      listener,
      true, // set `useCapture` to `true` to insert the listener at the beginning
    );
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].unshift({ callback, listener });
  }

  static getListeners(event) {
    if (this.listeners[event]) {
      return this.listeners[event];
    }
    return [];
  }

  static eventNames() {
    return Object.keys(this.listeners);
  }

  static removeAllListeners() {
    Object.keys(this.listeners).forEach((event) => {
      this.listeners[event].forEach(({ listener }) => {
        document.removeEventListener(event, listener);
      });
    });
    this.listeners = {};
  }
}
