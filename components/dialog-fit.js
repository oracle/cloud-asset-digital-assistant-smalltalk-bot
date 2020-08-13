'use strict';
/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle
 *   
 * IMPORTANT!
 * The bot confidence threshold will be ZERO (0) to be able to pick entities like YES or NO for example or other entities if required! In ODA if intent is not resolved, it will go to the Unresolved intent, which will not return the Entities. This could be problematic in cases where we don't want to resolve intent but only entities. For that reason make sure that the Unresolved intent goes to the Custom Entity parser from the code. Make also own unresolved Intent avaiable similar to the one used in DA Routing.
  
  smallTalk:
    component: "Fit"
    properties:
      nlpVariable: "iResult"
      intent: "${iResult.value.intentMatches.detail.final_norm[0].intent}"
      confidence: "${iResult.value.intentMatches.detail.final_norm[0].score}"
      transitionOutput: true
      confidenceThreshold: "${confidenceThreshold.value}"
      minConfidenceThreshold: "${minConfidenceThreshold.value}"
    transitions:
      next: "${(transition.value?has_content)?then('${transition.value}','smallTalkIntent')}"  
 */

let log4js = require('log4js');
let logger = log4js.getLogger();
logger.level = 'warm';

const dialog = require('./dialog-branch-logic');
const lodash = require('lodash');
const smallTalkServices = require('../utils/smalltalk-services');

// Example: load all branches from a folder!
// dialog.loadFromFolder('smalltalk', __dirname + "/..");
// dialog.loadFromFolder('expenses');

// Example: load branches for another langauge
// dialog.loadFromFolder('smalltalk-ar');

// Example: - load text chunks from a folder
// dialog.loadFromFolder('smalltalk-textchunks', __dirname + "/..", true);

// Example: load another language text chunks
// dialog.loadFromFolder('smalltalk-features-ar', undefined, true);

// global
dialog.setDialogInterceptor('FormalTimeGreetingMorning',
  smallTalkServices.FormalTimeGreetingMorningValidatorInterceptor);
dialog.setDialogInterceptor('FormalTimeGreetingAfternoon',
  smallTalkServices.FormalTimeGreetingAfternoonValidatorInterceptor);
dialog.setDialogInterceptor('FormalTimeGreetingEvening',
  smallTalkServices.FormalTimeGreetingEveningValidatorInterceptor);
dialog.setDialogInterceptor('DateSpecificGreetings',
  smallTalkServices.DateSpecificGreetingsValidator);
dialog.setDialogInterceptor('AskAboutTheTime',
  smallTalkServices.getCurrentTime);
dialog.setDialogInterceptor('AskAboutTheDay',
  smallTalkServices.getCurrentDate);

let intentModelInterim = {};
let textChunksInterim = {};
let userLastBotIntent = "user.lastBotIntent";
let userLastBotName = "user.lastBotName";
let userTextChunks = 'user.textChunks';

module.exports = {

  metadata: () => ({
    'name': 'Fit',
    'properties': {
      'nlpVariable': { 'type': 'string', 'required': true },
      'intent': { 'type': 'string', 'required': true },
      'botName': { 'type': 'string', 'required': false },
      'context': { 'type': 'string', 'required': false },
      'confidence': { 'type': 'number', 'required': true },
      'minConfidenceThreshold': { 'type': 'number', 'required': true },
      'confidenceThreshold': { 'type': 'number', 'required': true },
      'transitionOnUnknown': { 'type': 'boolean', 'required': false },
      'transitionOutput': { 'type': 'boolean', 'required': false }
    },
    'supportedActions': [
      'none',
    ],
  }),

  invoke: (conversation, done) => {
    logger.debug("enter Fit");

    // internal variables
    let smallTalkIntentsSettingsModel = "$$$smallTalkIntentsSettingsModel$$$";
    let smallTalkFeatureSettingsModel = "$$$smallTalkFeatureSettingsModel$$$";
    let smallTalkInterceptorFunction = "$$$smallTalkInterceptorFunction$$$";

    let req = conversation.request();
    let views = {};
    smallTalkIntentsSettingsModel = conversation.botId() + smallTalkIntentsSettingsModel;
    smallTalkFeatureSettingsModel = conversation.botId() + smallTalkFeatureSettingsModel;
    smallTalkInterceptorFunction = conversation.botId() + smallTalkInterceptorFunction;

    logger.debug('botId', conversation.botId());

    // load the internal models, but do this only once
    // this loads either the internal model or the one that comes from the bot itself!
    let intentModel = conversation.variable(smallTalkIntentsSettingsModel);
    if (!intentModel || lodash.isEmpty(intentModel)) intentModel = intentModelInterim;
    else intentModelInterim = intentModel;

    // empty the variable to have clean JSON debug in ODA
    conversation.variable(smallTalkIntentsSettingsModel, "");

    // load the dialog model for this bot!
    dialog.loadModel(intentModelInterim, true);

    // ### text chunks - get the global first and override with the internal if any for this bot!
    let globalTextChunks = conversation.variable(userTextChunks);
    if (!globalTextChunks) globalTextChunks = {};

    // local text chunkgs check!
    let textChunks = conversation.variable(smallTalkFeatureSettingsModel);
    if (!textChunks || lodash.isEmpty(textChunks)) textChunks = textChunksInterim;
    else textChunksInterim = textChunks;

    // merge together, the local text chunks always win! 
    textChunks = Object.assign(globalTextChunks, textChunks);

    // empty the variable to have clean JSON debug in ODA
    conversation.variable(smallTalkFeatureSettingsModel, "");

    // load the text chunks for th  is model
    dialog.loadFeatureModel(textChunks, true);

    // ### nlp
    let nlpVariable = conversation.properties().nlpVariable;
    let nlpResult = conversation.variable(nlpVariable);

    // resolve component properties
    let intent = conversation.properties().hasOwnProperty('intent') ?
      conversation.properties().intent : "";
    let botName = conversation.properties().hasOwnProperty('botName') ?
      conversation.properties().botName : nlpResult.botName;
    let score = conversation.properties().hasOwnProperty('confidence') ?
      conversation.properties().confidence : 0.0;
    let context = conversation.properties().hasOwnProperty('context') ?
      conversation.botId() + conversation.properties().context : conversation.botId();
    let confidenceThreshold = conversation.properties().hasOwnProperty('confidenceThreshold') ?
      conversation.properties().confidenceThreshold : 0.0;
    let minConfidenceThreshold = conversation.properties().hasOwnProperty('minConfidenceThreshold') ?
      conversation.properties().minConfidenceThreshold : 0.0;
    let transitionOnUnknownState = conversation.properties().hasOwnProperty('transitionOnUnknown') ?
      conversation.properties().transitionOnUnknown : false;
    let transitionOutput = conversation.properties().hasOwnProperty('transitionOutput') ?
      conversation.properties().transitionOutput : false;

    // this is where the entities for that context will be stored!
    let smallTalkEntitiesConfig = "$$$smallTalkEntitiesConfig$$$";
    let lastEntitiesKey = "$$$lastEntitiesFromContext$$$";
    smallTalkEntitiesConfig = smallTalkEntitiesConfig + context;
    lastEntitiesKey = lastEntitiesKey + context;

    // let intent = nlpResult.intentMatches.detail.final_norm[0].intent;
    // let score = nlpResult.intentMatches.detail.final_norm[0].score;

    // - build response
    let respond = function (response, transition = true) {
      if (response.hasOwnProperty("transition") && !lodash.isEmpty(response.transition)) {
        conversation.variable("transition", response.transition);
      }
      else if (response.hasOwnProperty('text')) {
        if (transitionOutput === true) {
          conversation.variable("transition", "output");
        }

        if (Array.isArray(response.text)) {
          for (let replay in response.text) {
            if (!lodash.isEmpty(replay)) {
              if (transitionOutput == false) {
                conversation.reply({ text: response.text[replay] });
              }
              else {
                conversation.variable("outputText", response.text[replay]);
              }
            } else {
              if (transitionOutput == false) {
                conversation.reply({ text: "No text response has been specified!" });
              }
              else {
                conversation.variable("outputText", "No text response has been specified!");
              }
            }
          }
        } else {
          if (transitionOutput == false) {
            conversation.reply(response);
          }
          else {
            conversation.variable("outputText", response);
          }
        }
      } else {
        if (transitionOutput == false) {
          conversation.reply({ text: response });
        }
        else {
          conversation.variable("outputText", response);
        }

      }

      if (transition === true || transitionOutput == true) {
        conversation.transition();
        done();
        return;
      }
    };

    // round the score!
    score = Math.round(Number(score) * 100);

    // debug
    let $lastBotIntent = lodash.clone(conversation.variable(userLastBotIntent));
    let $lastBotName = lodash.clone(conversation.variable(userLastBotName));
    logger.debug('#->>lastBotIntent #-> ', $lastBotIntent);
    logger.debug('#->>lastBotName   #-> ', $lastBotName);

    // current intent for the given bot!
    logger.debug('Intent:-> ', intent);
    logger.debug('intent confidence:-> ', score);
    if (intent === "unresolvedIntent") {
      intent = "";
    }
    // unresolvedIntentInternal is used to catch entities if nothing else works!
    else if (intent === "unresolvedIntentInternal") {
      intent = "";
    }

    // reset the transition variable
    conversation.variable("transition", "");

    // this is the gray area, where we have not fully confidence, so we don't want to get that new intent, but
    // we also don't want to proceed with component because maybe we will mess up, better
    // for the user to come up with new question/intent/entity!
    minConfidenceThreshold = Math.round(minConfidenceThreshold * 100);
    confidenceThreshold = Math.round(confidenceThreshold * 100);
    logger.debug("minConfidenceThreshold:", minConfidenceThreshold);
    logger.debug("confidenceThreshold:", confidenceThreshold);

    // the grey area, not enough confidence to say for sure but
    if ((score > minConfidenceThreshold) && (score < confidenceThreshold)) {
      // ### - confidence in the gray area better unresolved it!
      logger.debug('close to confidence but not exactly');
      respond(dialog.getDialog({ intent: '$unresolved' }, { 'intent': 'unresolved' }), false);

      if (transitionOnUnknownState === true) {
        conversation.transition('none');
      } else {
        conversation.transition();
      }

      done();
      return;
    }

    // set new intent only if the confidence equal or above the confidence threshold
    if ((Math.round(score * 100) < Math.round(confidenceThreshold * 100))) {
      intent = ''; // nothing to set!
    }

    // resolve entities to properties if any!
    let properties = {};

    // get now the NEW entities that has been set from YAML!
    let entities = conversation.variable(smallTalkEntitiesConfig);
    logger.debug("#entities", JSON.stringify(entities, null, 4));

    // remove empty entities, if any
    for (var key in entities) {
      if (entities.hasOwnProperty(key)) {
        if (entities[key] === null || lodash.isEmpty(entities[key]))
          delete entities[key];
      }
    }

    //  now get only the entities with a values
    if (entities) {
      for (var property in entities) {
        if (entities.hasOwnProperty(property)) {
          if (!lodash.isEmpty(entities[property])) {
            properties[property] = entities[property];
          }
        }
      }
    }

    logger.debug("#properties", JSON.stringify(properties, null, 4));

    // get now the last entities from the same context
    let lastEntities = conversation.variable(lastEntitiesKey);

    logger.debug("#last properties", JSON.stringify(lastEntities, null, 4));

    // if no intent or entities and the unknown state transition has been set, transition
    // to that state if provided!
    if (lodash.isEmpty(intent) && lodash.isEmpty(entities) && transitionOnUnknownState === true) {
      conversation.transition('none');
      done();
      return;
    }
    else if (lodash.isEmpty(intent) && (!lodash.isEmpty(entities) && lodash.isEqual(lastEntities, entities)) && transitionOnUnknownState === true) {
      conversation.transition('none');
      done();
      return;
    }
    else if (lodash.isEmpty(intent) && (!lodash.isEmpty(entities) && lodash.isEqual(lastEntities, entities))) {
      intent = "unresolvedIntentInternal";
    }
    else if (lodash.isEmpty(intent) && lodash.isEmpty(entities)) {
      intent = "unresolvedIntentInternal";
    }

    // !!!! - set the intent and bot name for the next call
    conversation.variable(userLastBotIntent, intent);
    conversation.variable(userLastBotName, botName);

    // see what we can do with the current information
    let response = {};
    try {
      response = dialog.getDialog({ intent: intent, nlp: nlpResult, lastBotName: $lastBotName, lastBotIntent: $lastBotIntent }, properties, properties); // properties = { "profilename": "name" }
    }
    catch (e) {
      response['text'] = "I am sorry, I was not able to find suitable dialog due to the following error:" + e.message
    }


    // set the new entities for the context to be used for the next cycle!
    conversation.variable(lastEntitiesKey, lodash.clone(entities));

    // reset all entities!
    for (let entity in entities) {
      if (entity in entities) {
        entities[entity] = null;
      }
    }

    // --
    respond(response);
  },
};
