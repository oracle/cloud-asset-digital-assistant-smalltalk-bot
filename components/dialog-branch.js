'use strict';
/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle
 *  
   # Example 
   Branches:
    component: "Branch"
    properties:
      branches:            
        - intent: "Greeting"
          interceptor: ""
          responseOptions:
              - properties:  
                decisionActionProperties:
                actions:
                responseItems:
                  - text:
                    - "Hi"
                  - text:
                    - "Hiya"  
                  - text:
                    - "Hello"  
        # - # - #
        - intent: "ChangeAccountLevel"
          interceptor: ""
          responseOptions:  
              - properties:
                  AccountLevelEntity: "NO"          
                responseItems:
                  - text: 
                    - "You would need to provide account level first, supported levels are: Account Level 5, 6 and 7"                
              - properties:  
                  AccountLevelEntity: "YES"
                decisionActionProperties:
                transition: "switchAccountLevelGlobal"
                actions:
 */

let log4js = require('log4js'),
    logger = log4js.getLogger(),
    lodash = require('lodash'),
    userBranch = 'user.Branch';

// For Debugging    
//logger.level = 'debug';

module.exports = {
    metadata: () => ({
        'name': 'Branch',
        'properties': {
            'global': { 'type': 'boolean', 'required': false },
            'branches': { 'type': 'array', 'required': true }
        },
        'supportedActions': [],
    }),

    invoke: (conversation, done) => {
        logger.debug("enter Branch");

        let smallTalkIntentsSettingsModel = "$$$smallTalkIntentsSettingsModel$$$";
        smallTalkIntentsSettingsModel = conversation.botId() + smallTalkIntentsSettingsModel;

        // if branches exist it will have priority!
        let branches = conversation.properties().hasOwnProperty('branches') ? conversation.properties().branches : {};
        let global = conversation.properties().hasOwnProperty('global') ?
            conversation.properties().global : false;

        // get previous settings, if any!
        let settings = {};
        if (global === true) settings = conversation.variable(userBranch)
        else settings = conversation.variable(smallTalkIntentsSettingsModel);

        //
        if (!settings) settings = {};

        // Mapping Branches
        let mapBranches = (branch) => {
            let intent = (branch.hasOwnProperty("intent")) ? branch.intent : "";
            let responses = (branch.hasOwnProperty("responseOptions")) ? branch.responseOptions : "";

            // mapping the objects to the internal structures
            settings[intent] = {
                "properties": {},
                "dialogs": []
            }

            for (var key in responses) {
                if (responses.hasOwnProperty(key)) {
                    let el = responses[key];

                    let ob = {
                        //"properties": {},
                        //"actions": {},
                        "replays": []
                    }

                    if (el.hasOwnProperty("properties")) {
                        ob["properties"] = el.properties;
                    }

                    if (el.hasOwnProperty("decisionActionProperties")) {
                        //ob.actions = el.decisionActionProperties;
                        ob["actions"] = {};
                        for (let key in el.decisionActionProperties) {
                            if (el.decisionActionProperties.hasOwnProperty(key)) {
                                ob["actions"][key] = el.decisionActionProperties[key];
                            }
                        }
                    }

                    if (el.hasOwnProperty("actions")) {
                        //ob.actions = el.actions;
                        if (!ob.hasOwnProperty("actions")) {
                            ob["actions"] = {};
                        }

                        for (let key in el.actions) {
                            if (el.actions.hasOwnProperty(key)) {
                                ob["actions"][key] = el.actions[key];
                            }
                        }
                    }

                    if (el.hasOwnProperty("transition")) {
                        ob["transition"] = el.transition;
                    }

                    // TODO: fix for the case when there is no response option!
                    if (el.hasOwnProperty("responseItems")) {
                        for (let key in el.responseItems) {
                            if (el.responseItems.hasOwnProperty(key)) {
                                ob.replays.push(el.responseItems[key]);
                            }
                        }
                    }
                    else {
                        ob.replays.push({ 'text': '' });
                    }

                    settings[intent].dialogs.push(ob);
                }
            }
        };

        if (!lodash.isEmpty(branches)) {
            if (Array.isArray(branches)) {
                branches.forEach(function (branch) {
                    if (branch.hasOwnProperty('intent') && branch.hasOwnProperty('responseOptions')) {
                        mapBranches(branch);
                    }
                });
            }
            else if (lodash.isObject(branches)) {
                if (branches.hasOwnProperty('intent') && branches.hasOwnProperty('responseOptions')) {
                    mapBranches(branches);
                }
            }
        }
        else {
            let branch = {}
            branch["intent"] = conversation.properties().hasOwnProperty('intent') ?
                conversation.properties().intent : '';
            branch["responseOptions"] = conversation.properties().hasOwnProperty('responseOptions') ?
                conversation.properties().responseOptions : []

            mapBranches(branch);
        }

        if (global === true) conversation.variable(userBranch, settings)
        else conversation.variable(smallTalkIntentsSettingsModel, settings);

        conversation.transition();
        done();
    }
};