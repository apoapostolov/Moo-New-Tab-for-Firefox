export default class EventBus {
  static listeners = Object.create(null);

  static subscribe(event, callback, capture = false, once = false) {
    const entry = { callback, capture, listener: null };
    entry.listener = (e) => {
      // Remove first so a callback that emits again still runs only once.
      if (once) this.remove(event, entry);
      callback(e.detail);
    };
    (this.listeners[event] ??= []).push(entry);
    document.addEventListener(event, entry.listener, { capture });
  }

  static on(event, callback) {
    this.subscribe(event, callback);
  }

  static emit(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  static remove(event, entry) {
    document.removeEventListener(event, entry.listener, { capture: entry.capture });
    this.listeners[event] = (this.listeners[event] || []).filter((item) => item !== entry);
    if (!this.listeners[event].length) delete this.listeners[event];
  }

  static off(event, callback) {
    for (const entry of this.listeners[event] || []) {
      if (entry.callback === callback) this.remove(event, entry);
    }
  }

  static once(event, callback) {
    this.subscribe(event, callback, false, true);
  }

  // Capture listeners run before bubbling listeners.
  static prepend(event, callback) {
    this.subscribe(event, callback, true);
  }

  static prependOnce(event, callback) {
    this.subscribe(event, callback, true, true);
  }

  static getListeners(event) {
    return (this.listeners[event] || []).map((entry) => entry.callback);
  }

  static eventNames() {
    return Object.keys(this.listeners);
  }

  static removeAllListeners() {
    for (const event of this.eventNames()) {
      for (const entry of this.listeners[event]) this.remove(event, entry);
    }
  }
}
