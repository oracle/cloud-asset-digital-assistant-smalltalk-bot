/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle
 * 
 * Define Dialog Events
 * @return {*} object
 */
const DialogListeners = (function DialogListeners() {
  /**
   * Events property is a hashmap, with each property being an array of callbacks!
   * @type {{}}
   */
  const events = {};

  /**
   * boolean determines whether or not the callbacks associated with each event should be
   * proceeded async, default is false!
   *
   * @type {boolean}
   */
  const asyncListeners = false;

  return {
    /**
     * Adds a listener to the queue of callbacks associated to an event
     *
     * @param {string} eventName - the name of the event to associate
     * @param {string} type - the name of the event to associate
     * @param {*} listener - the actual implementation
     * @return {*} - returns the ID of the lister to be use to remove it later
     */
    on(eventName, type, listener) {
      let event = events[eventName];
      if (!event) {
        events[eventName] = {};
        event = events[eventName][type] = [];
        event.push(listener);
        return listener;
      }

      event = events[eventName][type];
      if (!event) {
        event = events[eventName][type] = [];
      }

      event.push(listener);
      return listener;
    },

    get(eventName, type) {
      if (eventName && type && events[eventName] && events[eventName][type]) {
        return events[eventName][type];
      }
      return {};

    },
    /**
     * Fires event if specific event was registered, with the option of passing parameters
     * which are going to be processed by the callback
     * (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
     *
     * @param {string} eventName
     * @param {string} type
     * @param {*} data - optional object passed to the event!
     */
    emit(eventName, type, data) {
      if (eventName && type && events[eventName] && events[eventName][type]) {
        events[eventName][type].forEach((listener) => {
          if (asyncListeners) {
            setTimeout(() => {
              listener(data);
            }, 1);
          } else {
            listener(data);
          }
        });
      } else {
        // if event is not registered
        throw new Error(`No event ${eventName} with ${type} type defined`);
      }
    },
    /**
     * Remove listeners
     *
     * @param {string} eventName
     * @param {string} type
     * @param {*} listener
     */
    removeListener(eventName, type, listener) {
      if (events[eventName][type]) {
        const listeners = events[eventName][type];
        listeners.splice(listeners.indexOf(listener), 1);
      }
    },
  };
}());

module.exports = DialogListeners;
