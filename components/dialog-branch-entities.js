'use strict';
/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle

   # Example of how to set the entities in array! 
   setEntityVariables:
    component: "System.SetVariable" 
    properties:
      variable: "entities" 
      value:
        - name: "CURRENCY" 
          value: "${(compositeEntities.value.CURRENCY?has_content)?then('${compositeEntities.value.CURRENCY[0].amount}','')}"
        - name: "DATE" 
          value: "${(compositeEntities.value.DATE?has_content)?then('${compositeEntities.value.DATE[0].originalString}','')}"
        - name: "YESNO" 
          value: "${(compositeEntities.value.YES_NO?has_content)?then('${compositeEntities.value.YES_NO[0].yesno}','')}"
        - name: "YES_NO" 
          value: "${(compositeEntities.value.YES_NO?has_content)?then('${compositeEntities.value.YES_NO[0].yesno}','')}"          
    transitions:
      next: "smallTalkEntity"
          
  ## IF NO ENTITIES in the sentence, set to empty string
  setEmptyEntity:
    component: "System.SetVariable" 
    properties:
      variable: "entities" 
      value: ""
    transitions:
      next: "smallTalkEntity"

   # now use this component to pass to the FIT component later and be used in the dialog selection process
      
   smallTalkEntity:
    component: "Entities"
    properties:
      ENTITIES: "entities"
      SYSTEM: "${iResult.value.entityMatches['SmallTalkEntity'][0]}"

 */

const lodash = require('lodash');
let log4js = require('log4js');
let logger = log4js.getLogger();
logger.level = 'debug';

module.exports = {
    metadata: () => ({
        'name': 'Entities',
        'properties': {
            'SYSTEM': { 'type': 'string', 'required': false },
            'ENTITIES': { 'type': 'string', 'required': false },
            'context': { 'type': 'string', 'required': false },
            'oldEntityParseModel': { 'type': 'boolean', 'required': false }
        },
        'supportedActions': [],
    }),

    invoke: (conversation, done) => {
        logger.debug("enter Entities " + conversation.botId());

        let oldEntityParseModel = conversation.properties().hasOwnProperty('oldEntityParseModel') ?
            conversation.properties().oldEntityParseModel : false;
        let context = conversation.properties().hasOwnProperty('context') ?
            conversation.botId() + conversation.properties().context : conversation.botId();

        let smallTalkEntitiesConfig = "$$$smallTalkEntitiesConfig$$$";
        smallTalkEntitiesConfig = smallTalkEntitiesConfig + context;


        let settings = conversation.variable(smallTalkEntitiesConfig);
        if (!settings) settings = {};

        // SYSTEM should contain all properties that are out of the box in composite bag!
        if (conversation.properties().hasOwnProperty('SYSTEM') &&
            lodash.isObject(conversation.properties().SYSTEM) &&
            !lodash.isEmpty(conversation.properties().SYSTEM)) {

            const { SYSTEM } = conversation.properties();

            if (!lodash.isEmpty(SYSTEM)) {
                let entities = SYSTEM;

                for (var key in entities) {
                    if (entities.hasOwnProperty(key) && !lodash.isEqual(key, "entityName")) {
                        for (var i = 0, len = entities[key].length; i < len; i++) {
                            settings[key] = entities[key][i];
                        }
                    }
                }
            }
        }

        if (conversation.properties().hasOwnProperty('ENTITIES') &&
            lodash.isString(conversation.properties().ENTITIES) &&
            !lodash.isEmpty(conversation.properties().ENTITIES)) {

            const ENTITIES = conversation.variable(conversation.properties().ENTITIES);

            if (!lodash.isEmpty(ENTITIES)) {
                let entities = ENTITIES;

                for (var i = 0, len = entities.length; i < len; i++) {
                    if ((entities[i].hasOwnProperty("name") && entities[i].hasOwnProperty("value")) &&
                        (!lodash.isEmpty(entities[i]["name"]) && entities[i]["value"] != undefined)) {
                        let value = undefined;

                        if (oldEntityParseModel === true) value = conversation.variable(entities[i]["value"])
                        else value = entities[i]["value"];

                        if (!value || value == undefined || lodash.isEmpty(value)) {
                            continue;
                        } else {
                            settings[entities[i]["name"]] = value;
                        }
                    }
                }
            }
        }

        conversation.variable(smallTalkEntitiesConfig, settings);
        conversation.transition();
        done();
    }
};