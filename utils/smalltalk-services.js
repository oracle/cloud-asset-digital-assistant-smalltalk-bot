/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle
 */
const moment = require('moment');

/**
 * @typedef {Object} SmallTalkServices - small-talk services
 *
 */
const SmallTalkServices = (function () {
  // find what day time really is!

  function getTime() {


    return moment().format("hh:mm:ss a");
  }



  /**
   * Get the current day time to compare with the greeting time
   * @param {*} m
   * @return {string} - if it's afternoon, evening or morning
   */
  function getGreetingTime(m) {
    let g = null; // return g

    // if we can't find a valid or filled moment, we return.
    if (!m || !m.isValid()) {
      return '';
    }

    let splitAfternoon = 12; // 24hr time to split the afternoon
    let splitEvening = 17; // 24hr time to split the evening
    let currentHour = parseFloat(m.format('HH'));

    if (currentHour >= splitAfternoon && currentHour <= splitEvening) {
      g = 'afternoon';
    } else if (currentHour >= splitEvening) {
      g = 'evening';
    } else {
      g = 'morning';
    }

    return g;
  }

  let FormalTimeGreetingMorningValidatorInterceptor = function ({
    intent = '', nlp = {},
    properties = {}, views = {},
  }) {
    let whatisnow = getGreetingTime(moment());
    if (whatisnow !== 'morning') {
      properties.validator = false;
      views.MESSAGE = whatisnow;
    }
    return { intent, nlp, properties, views };
  };

  let FormalTimeGreetingEveningValidatorInterceptor = function ({ intent, nlp, properties, views }) {
    let whatisnow = getGreetingTime(moment());
    if (whatisnow !== 'evening') {
      properties.validator = false;
      views.MESSAGE = whatisnow;
    }
    return { intent, nlp, properties, views };
  };

  let FormalTimeGreetingAfternoonValidatorInterceptor = function ({ intent, nlp, properties, views }) {
    let whatisnow = getGreetingTime(moment());
    if (whatisnow !== 'afternoon') {
      properties.validator = false;
      views.MESSAGE = whatisnow;
    }
    return { intent, nlp, properties, views };
  };

  let getDateDifference = function (dateEntity) {
    let userDate = moment(dateEntity.DATE[0].date);
    let rightNow = moment();
    // TODO: make possible to return negative for holidays which just passed!
    return rightNow.isBefore(userDate) ? userDate.diff(rightNow, 'days') : rightNow.diff(userDate, 'days');
  };


  let DateSpecificGreetingsValidator = function ({ intent, nlp, properties, views }) {
    let entities = nlp.entityMatches;

    if (entities && entities.hasOwnProperty('DATE')) {
      let diff = getDateDifference(entities);
      if (diff > 0) {
        console.log('not yet:', diff);

        properties.wrongdate = true;
        properties.diff = 'positive';
      } else if (diff < 0) {
        console.log('it was already:', diff);

        properties.wrongdate = true;
        properties.diff = 'negative';
      } else {
        // ok equal, all good
        console.log('that\'s the day', diff);
      }

      if (entities && entities.hasOwnProperty('DATE')) {
        views.entity = entities.DATE[0].originalString;
        views.days = Math.abs(diff);
      }

      // we know you there and we don't like you...!:)
      delete properties.DATE;
    }

    return { intent, nlp, properties, views };
  };

  let getCurrentTime = function ({ intent, nlp, properties, views }) {
    let timeNow = getTime();
    views.timeNow = timeNow;

    return { intent, nlp, properties, views };
  };

  let getCurrentDate = function ({ intent, nlp, properties, views }) {
    let dateNow = moment().format("DD-MM-YYYY");
    views.dateNow = dateNow;

    return { intent, nlp, properties, views };
  };

  return {
    FormalTimeGreetingMorningValidatorInterceptor: FormalTimeGreetingMorningValidatorInterceptor,
    FormalTimeGreetingEveningValidatorInterceptor: FormalTimeGreetingEveningValidatorInterceptor,
    FormalTimeGreetingAfternoonValidatorInterceptor: FormalTimeGreetingAfternoonValidatorInterceptor,
    // checks for holidays
    DateSpecificGreetingsValidator: DateSpecificGreetingsValidator,
    // get current time or nothing
    getCurrentTime: getCurrentTime,
    getCurrentDate: getCurrentDate
  };
})();

module.exports = SmallTalkServices;
