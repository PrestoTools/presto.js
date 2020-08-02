export default class EventDispatcher {
  constructor() {
    this.events = {};
  }

  addListener(event, callback) {
    if (!this.events.hasOwnProperty(event)) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  removeListener(event, fn) {
    if (event === undefined) {
      this.events = {};
      return;
    }
    let newEvents = {};
    Object.keys(this.events).forEach(k => {
      if (k === event) {
        let updated = [];
        if (Array.isArray(this.events[k])) {
          this.events[k].forEach((callback) => {
            if (callback !== fn) {
              updated.push(callback);
            }
          });
        }
        newEvents[k] = updated;
      } else {
        newEvents[k] = this.events[k];
      }
    });
    this.events = newEvents;
  }

  dispatch(event, args) {
    const argArray = args === undefined ? [] : args;
    if (this.events[event] === undefined) {
      return;
    }
    this.events[event].forEach((callback) => {
      callback(...argArray);
    });
  }
}
