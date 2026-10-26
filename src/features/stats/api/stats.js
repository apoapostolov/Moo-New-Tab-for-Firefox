export default class Stats {
  /** Increments a counter: `type` groups it, `name` is the event within that group. */
  static async postEvent(type, name) {
    const value = name.toLowerCase().replaceAll(' ', '-');

    const data = JSON.parse(localStorage.getItem('statsData')) || {};
    // Creates the storage objects when they do not exist yet.
    if (!data[type] || !data[type][value]) {
      if (!data[type]) {
        data[type] = {};
      }

      if (!data[type][value]) {
        data[type][value] = 1;
      }
    } else {
      data[type][value] = data[type][value] + 1;
    }
    localStorage.setItem('statsData', JSON.stringify(data));
  }

  /** Bumps the 'tabs-opened' counter. */
  static async tabLoad() {
    const data = JSON.parse(localStorage.getItem('statsData')) || {};
    data['tabs-opened'] = data['tabs-opened'] + 1 || 1;
    localStorage.setItem('statsData', JSON.stringify(data));
  }
}
