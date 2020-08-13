'use strict';
/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle 
 * 
 *  
  
  # Example 
  TextChunks:
    component: "TextChunks"
    properties:
      global: false # default is false!
      responseOptions:
        - name: "OracleURL"
          responseItems: 
            - "https://www.oracle.com/bots"
        - name: "OraclePhone"
          responseItems: 
            - "1800-XXX-XXX"
        - name: "OracleOdaName"
          responseItems: 
            - "'Oracle Digital Assistant'"
        - name: "neutral"
          responseItems: 
            - "Gotcha"
            - "Alright"
            - "Sure"
            - "No problem"
            - "OK"
        - name: "positive"
          responseItems: 
            - "Nice"
            - "Great"
            - "Amazing"
            - "You did great"
            - "Woo hoo"
            - "Keep it up"
            - "Bravo"
            - "Well done"
            - "Wow"


  # Usage Example in Branch:
  Branches:
    component: "Branch"
    properties:
      branches:
        - intent: "AskConfidence"
          interceptor: ""
          responseOptions:
              - properties:  
                decisionActionProperties:
                actions: 
                responseItems:
                  - text:
                    - "{{$$textChunk.confidence}}"
    
        - intent: "Teach"
          interceptor: ""
          responseOptions:
              - properties:  
                decisionActionProperties:
                actions: 
                responseItems:
                  - text:
                    - "Sure, please visit the {{$$textChunk.OracleOdaName}} page {{$$textChunk.OracleURL}} for more information!"
              - properties:  
                  $lastIntent: "Teach"
                decisionActionProperties:
                actions: 
                responseItems:
                  - text:
                    - "As I already mentioned, please visit the {{$$textChunk.OracleOdaName}} page {{$$textChunk.OracleURL}} for more information!"

 */

let log4js = require('log4js');
let logger = log4js.getLogger();
logger.level = 'debug';
let userTextChunks = 'user.textChunks';

/**
 * global - to set the property as user property, so that these text chunks are avaiable across bots skills
 * responseOptions - name and values of the chunks to use to build sentences. They will be always randomly selected!
 */
module.exports = {
  metadata: () => ({
    'name': 'TextChunks',
    'properties': {
      'global': { 'type': 'boolean', 'required': false },
      'responseOptions': { 'type': 'array', 'required': true }
    },
    'supportedActions': [],
  }),

  invoke: (conversation, done) => {
    logger.debug("enter TextChunks");

    let smallTalkFeatureSettingsModel = "$$$smallTalkFeatureSettingsModel$$$";
    smallTalkFeatureSettingsModel = conversation.botId() + smallTalkFeatureSettingsModel;
    let global = conversation.properties().hasOwnProperty('global') ?
      conversation.properties().global : false;

    let settings = {};
    if (global === true) settings = conversation.variable(userTextChunks)
    else settings = conversation.variable(smallTalkFeatureSettingsModel);

    if (!settings) settings = {};

    // get the options
    let responses = conversation.properties().hasOwnProperty('responseOptions') ?
      conversation.properties().responseOptions : [];

    if (responses && Array.isArray(responses)) {
      responses.forEach(function (item) {
        if (item.hasOwnProperty('name') && item.hasOwnProperty('responseItems')) {
          settings[item.name] = {
            "dialogs": [
              {
                "replays": item.responseItems
              }
            ]
          }
        }
      });
    }

    if (global === true) conversation.variable(userTextChunks, settings)
    else conversation.variable(smallTalkFeatureSettingsModel, settings);

    //
    conversation.transition();
    done();
  }
};