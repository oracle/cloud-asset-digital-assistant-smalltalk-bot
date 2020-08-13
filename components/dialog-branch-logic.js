/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 * 
 * Created by Lyudmil Pelov, Oracle 
 *  
 * Main Dialog Implementation
 */

const fs = require('fs');
const Mustache = require('mustache');
const lodash = require('lodash');
const DecisionTree = require('../utils/decision-tree');
const listeners = require('../utils/smalltalk-listeners');

Mustache.escape = function (text) { return text; };

const Dialog = (function () {
  let
    isTemplate = /\{\{(.*?)\}\}/igm,
    isFeature = /\{\{\$\$textChunk.(.*?)\}\}/igm,
    $$model = {},
    $$randArr = '$$randArr',
    $$randArrTemplate = '$$randArrTemplate',
    $$currentLanguage = '',
    $$repeatThreshold = 2,
    $$lastIntent = '', // store the last used intent
    $$lastProperties = {}, // store last used properties!
    $$actions = {},
    $$dt = new DecisionTree([], '', []),
    $$lastIntentUsageCount = 0; // store in case of repeating

  let $$textChunk = {};

  let loadFromFolder = function (folderDir, dirname = __dirname, isFeature = false) {
    let normalizedPath = require('path').join(dirname, folderDir);

    require('fs').readdirSync(normalizedPath).forEach(function (file) {
      if (!lodash.startsWith(file, '_')) {
        let model = fs.readFileSync(dirname + '/' + folderDir + '/' + file, 'utf8');
        try {
          model = JSON.parse(model);
          !isFeature ? loadModel(model) : loadFeatureModel(model);
          // loadModel(model);
        } catch (e) {
          console.log('unable to load: ' + dirname + '/' + folderDir + '/' + file);
          console.log(e);
        }
      }
    });

    // on file changes, reload that file
    // watch modules would be useful in case the JSON files are used instead of the YAML in ODA!
    fs.watch(dirname + '/' + folderDir + '/', (eventType, file) => {
      if (file && eventType == 'change') {
        if (!lodash.startsWith(file, '_')) {
          let model = fs.readFileSync(dirname + '/' + folderDir + '/' + file, 'utf8');
          try {
            model = JSON.parse(model);
            !isFeature ? loadModel(model, true) : loadFeatureModel(model);
          } catch (e) {
            console.log('unable to load: ' + dirname + '/' + folderDir + '/' + file);
            console.log(e);
          }
        }
      } else {
        console.log('filename not provided');
      }
    });
  };

  let loadModel = function (model = {}, force = false) {
    if (lodash.isEmpty(model)) return this;
    if (!lodash.isObject(model)) return this;

    for (let property in model) {
      if (model[property]) {
        if (!$$model[property] || force) {
          // if that model does not exist load it
          $$model[property] = model[property];

          // initially mix the dialogs
          if ($$model[property]['dialogs']) {
            setRandomArray($$model[property]['dialogs']);
          }

          // unresolved
          if ($$model['unresolved'] && $$model['unresolved']['dialogs']) {
            setRandomArray($$model['unresolved']['dialogs']);
          }
        }
      }
    }

    return this;
  };

  /**
   * Load given JSON model into the response dialog engine!
   * @param {*} model
   * @return {*}
   */
  let loadFeatureModel = function (model = {}, force = false) {
    if (lodash.isEmpty(model)) return this;
    if (!lodash.isObject(model)) return this;

    for (let property in model) {
      if (model[property]) {
        if (!$$textChunk[property] || force) {
          // if that model does not exist load it
          $$textChunk[property] = model[property];

          // initially mix the dialogs
          if ($$textChunk[property]['dialogs']) {
            setRandomArray($$textChunk[property]['dialogs']);
          }


        }
      }
    }

    return this;
  };

  /**
   * Gets random number between min and max
   * @param {*} min
   * @param {*} max
   * @return {*}
   */
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Try to produce some message to the user
   * @param {*} intent - make sure that language intent is set before call this function!
   * @param {*} forceGlobalError - in case you want to force the global error message!
   * @return {*}
   */
  function internalUnresolvedResponse(intent = {}, forceGlobalError = false) {
    // this will be general unresolved property everytime, this was called!
    $$lastIntent = '$unresolved';

    /**
     * @return {*} - some form of unresulved intent model
     */
    function returnIntentOrGlobalUnresolved() {
      let $unresolved = getLanguageIntent('$unresolved');
      let $$$unresolved = getLanguageIntent('$$$unresolved');

      if ($$model[$unresolved]) {
        let dialog = generateDialogInternal({ intent: $$model[$unresolved] });
        if (dialog && !lodash.isEmpty(dialog)) {
          return dialog;
        }
        // plan B
        // this should exist at any codes!
        if ($$model[$$$unresolved]) {
          let dialog = generateDialogInternal({ intent: $$model[$$$unresolved] });
          if (dialog && !lodash.isEmpty(dialog)) {
            return dialog;
          }
        }

        // TODO: Make that configurable as well!
        return { text: 'Damn, I could not find any dialog, do not know what to do!' };
      } else {
        // this should exist at any codes!
        if ($$model[$$$unresolved]) {
          let dialog = generateDialogInternal({ intent: $$model[$$$unresolved] });
          if (dialog && !lodash.isEmpty(dialog)) {
            return dialog;
          }
        }
        return { text: 'Damn, I could not find any dialog, do not know what to do!' };
      }
    }

    // intent = getLanguageIntent(intent);

    // ok if intent and is not empty check to see if there is unresolved dialog
    if (intent && !lodash.isEmpty(intent)) {
      // try to find that internal unresolved, and see if it can return something
      let dialog = generateDialogInternal({ intent: intent, property: 'unresolved' });
      if (dialog && !lodash.isEmpty(dialog)) {
        return dialog;
      }
      return returnIntentOrGlobalUnresolved();
    } else { // ok there is no intent
      return returnIntentOrGlobalUnresolved();
    }
  }

  let mixTypes = {
    ALL: 1,
    RANGARR: 2,
    RANGARRTEMPLATE: 3,
  };

  let isMixType = function (type, ...types) {
    return types.indexOf(type) > -1 || types.indexOf(0) > -1;
  };

  /**
   * Mix all avaiable replays and set it into the dialog!
   *
   * @param {*} dialog
   * @param {*} type
   */
  function setDialogRandomArray(dialog, type = mixTypes.ALL) {
    if (dialog['replays']) {
      isMixType(type, mixTypes.ALL, mixTypes.RANGARR) && (dialog[$$randArr] = []);
      isMixType(type, mixTypes.ALL, mixTypes.RANGARRTEMPLATE) && (dialog[$$randArrTemplate] = []);

      for (let $i = 0; $i < dialog['replays'].length; $i++) {
        // double check that text is array!
        if (dialog.replays[$i].hasOwnProperty('text') && Array.isArray(dialog.replays[$i].text)) {
          let isTemplate = false;
          if (isMixType(type, mixTypes.ALL, mixTypes.RANGARRTEMPLATE)) {
            for (let pos in dialog.replays[$i].text) {
              if (isTextMustacheTemplate(dialog.replays[$i].text[pos])) {
                dialog[$$randArrTemplate].push($i);
                isTemplate = true;
                break;
              }
            }
          }

          // if not template
          if (!isTemplate && isMixType(type, mixTypes.ALL, mixTypes.RANGARR)) {
            dialog[$$randArr].push($i);
          }
        } else if (!dialog.replays[$i].hasOwnProperty('text')) {
          let isTemplate = false;
          if (isMixType(type, mixTypes.ALL, mixTypes.RANGARRTEMPLATE)) {
            if (isTextMustacheTemplate(dialog.replays[$i])) {
              dialog[$$randArrTemplate].push($i);
              isTemplate = true;
            }
          }

          // if not template
          if (!isTemplate && isMixType(type, mixTypes.ALL, mixTypes.RANGARR)) {
            dialog[$$randArr].push($i);
          }
        }
      }
    }
  }

  /**
   * Set array of random numbers of textes for dialog to pick later!
   * @param {*} dialog
   */
  function setRandomArray(dialog) {
    if (Array.isArray(dialog)) {
      for (let i = 0, len = dialog.length; i < len; i++) {
        setDialogRandomArray(dialog[i], mixTypes.ALL);
      }
    }
  }

  /**
   * Try to get one of the textes randomly!
   * this has to be specific part of the dialog!
   * depending on if there is view or not prefer the one with the view
   *
   * @param {*} dialog
   * @param {*} isView
   * @return {*}
   */
  function getRandomDialogText(dialog, isView) {
    // anonymous func
    let getRandomArray = function (dialogArray) {

      const num = Math.floor(Math.random() * dialogArray.length);
      // remove that index from the array, returns copy
      let removed = dialogArray.splice(num, 1);
      return removed[0];
    };

    // check the range array
    if (!isView && dialog[$$randArr] && dialog[$$randArr].length > 0) {
      const index = getRandomArray(dialog[$$randArr]);
      dialog[$$randArr].length === 0 && setDialogRandomArray(dialog, mixTypes.RANGARR);
      return lodash.clone(dialog['replays'][index]);
    } else if (isView && dialog[$$randArrTemplate] && dialog[$$randArrTemplate].length > 0) {
      // so we have view
      const index = getRandomArray(dialog[$$randArrTemplate]);
      dialog[$$randArrTemplate].length === 0 && setDialogRandomArray(dialog, mixTypes.RANGARRTEMPLATE);
      return lodash.clone(dialog['replays'][index]);
    } else {
      // if for whatever reason non of the above works, but there is array with replays, just grab one random

      if (dialog[$$randArr] && dialog[$$randArr].length > 0) {
        const index = getRandomArray(dialog[$$randArr]);
        dialog[$$randArr].length === 0 && setDialogRandomArray(dialog, mixTypes.RANGARR);
        return lodash.clone(dialog['replays'][index]);
      } else { // last chance!
        const r = getRandomInt(0, dialog['replays'].length - 1);
        return lodash.clone(dialog['replays'][r]);
      }
    }
  }

  /**
   * Introducing Poor-Man-Decision-Tree Logic!:)
   *
   * we will set the decision tree only if used, lazy loading:), since if there is
   * intent that not get used we don't need to have the model insight, this may be little bit slower,
   * on first load but after that should be OK
   *
   * @param {*} param0
   * @param {*} properties
   * @return {*}
   */
  function findDialogByProperties({ intent, module = '' }, properties = {}) {
    let dialogs = null; // empty dialog
    if (module && !lodash.isEmpty(module)) {
      if (!intent[module]) {
        return dialogs; // nothing to return
      }
      dialogs = intent[module]['dialogs'] ? intent[module]['dialogs'] : [];
    } else {
      dialogs = intent['dialogs'] ? intent['dialogs'] : [];
    }

    if (!dialogs.hasOwnProperty('$$$dtModel')) {
      // we need to create one:)
      dialogs.$$$dtModel = {};
      let trainingData = [];
      let className = 'index';
      let features = [];// decision trees features!
      let featuresSet = new Set();
      featuresSet.add('$isRepeating').add('$lastIntent');

      for (let i = 0, len = dialogs.length; i < len; i++) {
        // { index: '3', $isRepeating: true, YES_NO: 'YES' },
        // we can have this situation only once
        if (!dialogs[i].hasOwnProperty('properties') || lodash.isEmpty(dialogs[i]['properties'])) {
          trainingData.push({ index: i });
          continue;
        }

        let tmpTrainingSet = { index: i };
        for (let property in dialogs[i]['properties']) {
          if (dialogs[i].properties.hasOwnProperty(property)) {
            featuresSet.add(property); // add only if not exist
            tmpTrainingSet[property] = dialogs[i].properties[property];
          }
        }
        trainingData.push(tmpTrainingSet);
      }

      // make the model
      features = Array.from(featuresSet);
      let dt = new DecisionTree(trainingData, className, features);
      dialogs.$$$dtModel = dt.toJSON();
    }


    // as long as the models are not too big this should be OK, max model can be around same
    // size as RAM memory!
    $$dt.import(dialogs.$$$dtModel);
    let predictedReplayIndex = $$dt.predict(properties);
    // if something
    return (predictedReplayIndex && predictedReplayIndex >= 0) ? dialogs[predictedReplayIndex] : dialogs[0];
  }

  let exportModel = function () {
    return $$model;
  };

  let exportFeatureModel = function () {
    return $$textChunk;
  };

  let isTextMustacheTemplate = function (text) {
    return text.match(isTemplate);
  };

  let isFeatureModel = function (text) {
    let regex = isFeature, result, indices = [];

    while ((result = regex.exec(text))) {
      indices.push(result);
    }

    // return all results or 0 array if non!
    return indices.length > 0 ? indices : false;
  };

  /**
   * Sets dialog interceptor where you can change the properties views or even the intent!
   *
   * @param {*} intent
   * @param {*} listener
   * @return {*}
   */
  let setDialogInterceptor = function (intent = '', listener) {
    return listeners.on(intent, 'interceptors', listener);
  };

  /**
   * Runs all interceptors for given intent
   * @param {*} param0
   * @return {*}
   */
  let runDialogInterceptor = function ({ intent = '', nlp = {}, properties = {}, views = {} }) {
    // this will be list of promises
    let interceptors = listeners.get(intent, 'interceptors');

    if (!interceptors || lodash.isEmpty(interceptors)) {
      return {
        intent, nlp, properties, views,
      };
    }

    // clone the properties to prevent overriding!
    let result = {
      intent: lodash.clone(intent),
      nlp: lodash.clone(nlp),
      properties: lodash.clone(properties),
      views: lodash.clone(views),
    };

    try {
      interceptors.forEach(function (validator) {
        if (lodash.isFunction(validator)) {
          // result provides the latest result to the next validator
          result = validator.call(this, result);
          if (!result || lodash.isEmpty(result) || !lodash.isObject(result) ||
            lodash.isFunction(result)) {
            // ok if this is the case re-use the original values again for the next call!
            result = { intent, nlp, properties, views };
          }
        }
      });

      // if the custom interceptor didn't manage to return something, go back
      // to the original properties!
      return (!result || lodash.isEmpty(result) || !lodash.isObject(result) ||
        lodash.isFunction(result)) ? { intent, nlp, properties, views } : result;
    } catch (e) {
      // we don't want to break the code, just return false!
      // however if here make sure that we return the original specified properties!
      console.log(e);
      return { intent, nlp, properties, views };
    }
  };

  /**
   * Try to find feature model in given text and replace it if the according feature values!
   *
   * @param {*} text
   * @param {*} view
   * @return {*}
   */
  let addFeaturesIfAny = function (text = '', view = {}) {
    // will return false otherwise
    let isFeature = isFeatureModel(text);
    if (isFeature) {
      // ok there are features add that property
      view['$$textChunk'] = {};

      for (let i = 0; i < isFeature.length; i++) {
        let feature = isFeature[i][1], orgFeature = null;
        // check that the name of the subject starts with (
        if (view.hasOwnProperty(feature)) {
          orgFeature = isFeature[i][1];
          feature = view[feature];
        }

        // check that this feature exist
        if (feature in $$textChunk) {
          // get that dialog
          let dialog = $$textChunk[feature]['dialogs'];
          if (dialog) {
            let featureTxt = getRandomDialogText(dialog[0], false); // false - because we don't support views in features!

            if (featureTxt) {
              orgFeature ? view['$$textChunk'][orgFeature] = featureTxt : view['$$textChunk'][feature] = featureTxt;
            } else {
              console.log('cannot get reandom text from the dialog [' + dialog[0] + '] in the feature [' + feature + ']');
            }
          } else {
            console.log('could find property [dialogs] under the feature [' + feature + ']');
          }
        }
      }
    }
    return view;
  };

  let getRandomDialog = function (dialog = {}, view = {}) {
    if (!lodash.isEmpty(dialog)) {
      let response = {};
      let replay = getRandomDialogText(dialog, !lodash.isEmpty(view));
      response['text'] = [];

      // go over the text array and parse if its template
      for (let i = 0, len = replay.text.length; i < len; i++) {
        let txt = replay.text[i];
        if (isTextMustacheTemplate(txt)) {
          view = addFeaturesIfAny(txt, view);
          let yo = Mustache.render(txt, view);
          response.text.push(yo);
        } else {
          response.text.push(txt);
        }
      }

      // in case of transition, this will allow to transition to different state withing the YAML
      if (dialog.hasOwnProperty("transition") && !lodash.isEmpty(dialog.transition) && lodash.isString(dialog.transition)) {
        response['transition'] = "";
        response['transition'] = dialog.transition;
      }

      return response;
    }

    // use the internal response!
    return internalUnresolvedResponse();
  };

  // use this in case the model is already specified
  let generateDialogInternal = function ({ intent, property = '' }, properties = {}, view = {}) {
    if (!intent || lodash.isEmpty(intent)) {
      return [];
    }

    let dialog = findDialogByProperties({ intent: intent, module: property }, properties);
    return (dialog && !lodash.isEmpty(dialog) && dialog['replays']) ? getRandomDialog(dialog, view) : [];
  };

  /**
   * Set the intent based on the current language if that language property set, this will be called,
   * every time @function getDialog is used!
   *
   * @param {*} intent
   * @param {*} model
   * @return {*}
   */
  let getLanguageIntent = function (intent = '', model = {}) {
    if (!lodash.isEmpty($$currentLanguage) && lodash.isString($$currentLanguage) &&
      $$currentLanguage.length >= 2) {
      // test to see if exist otherwise fall back to the default model
      let langIntent = intent + '-' + lodash.toLower($$currentLanguage);
      if ($$model[langIntent]) {
        return langIntent;
      }
      return intent;
    }
    return intent;
  };

  /**
   * Get dialog!
   * @param intent - intent from the nlp result object
   * @param nlp - nlpresult object, or any object you want to use here
   * @param botId - uuid of the current bot user, to store the conversation history under
   * @param lang - current language to use
   * @param properties - Object: set of properties as object to be able to select specific dialog
   * @param views - Object: view properties to pass to the view model to be shown!
   * @return {*}
   */
  let generateDialog = function ({ intent = '', nlp = {}, botId = '', lang = '', lastBotName = '', lastBotIntent = '' }, properties = {}, views = {}) {
    // immediately set the name of the last bot that has been used!

    properties['$lastBotName'] = lastBotName;
    $$currentLanguage = lang;

    // model the intent for given language if any
    intent = getLanguageIntent(intent);

    if (!$$model[intent]) {
      // if actions contains intent we could use to change the flow
      if (Object.prototype.hasOwnProperty.call($$actions, '$gotoIntent')) {
        intent = $$actions['$gotoIntent'];
        if ("$lastIntent" == intent) {
          intent = $$lastIntent;
        }
        if (!$$model[intent]) {
          return internalUnresolvedResponse();
        }
      } else {
        // maybe we just want to work-out the last intent!!!
        if (!$$model[$$lastIntent]) {
          return internalUnresolvedResponse();
        } else {
          // but if this is the case, BUT only if there are new properties!!!!
          if (!lodash.isEmpty(properties) && !lodash.isEqual($$lastProperties, properties)) {
            intent = $$lastIntent;
          } else {
            return internalUnresolvedResponse();
          }
        }
      }
    }

    // now before we setup what last intent should be, we need to do following:
    // check if there is a last bot intent and check if this last bot intent is different the the bot we have now!
    if (lastBotIntent && !lodash.isEmpty(lastBotIntent)) {
      $$lastIntent = lastBotIntent;
    }

    // TODO: properties play important role too, since they represent the entities,
    // if the entities change with the same intent, we may have
    // different situation here!
    // add internal optional properties
    let $lastIntentRemoveIfNotUsed = $$lastIntent;
    properties['$lastIntent'] = $$lastIntent;

    // can be used to check how often the same is asked again and again, except this was unresolved intent of course!
    if ((!lodash.isEqual(intent, '$unresolved') || !lodash.isEqual(intent, '$$$unresolved')) &&
      (lodash.isEqual($$lastIntent, intent) && lodash.isEqual($$lastProperties, properties))) {
      $$lastIntentUsageCount += 1; // used again!
    } else {
      $$lastIntentUsageCount = 0; // reset!
    }

    // TODO: use the BotID to store the history in the future!
    $$lastIntent = intent;
    $$lastProperties = lodash.clone(properties);

    // internal property for repeating!
    if ($$lastIntentUsageCount > 0) {
      properties['$isRepeating'] = true;
    }

    // find the high level dialog for given intent!
    let intentModel = $$model[intent];

    // check if this is repeating!
    if ($$lastIntentUsageCount == $$repeatThreshold) {
      let $$repetitiveThresholdModel = getLanguageIntent('$$repetitiveThresholdModel');
      intentModel = $$model[$$repetitiveThresholdModel];
      properties = {}; // reset it from everything else
      properties['hitThreshold'] = true;
    } else if ($$lastIntentUsageCount > $$repeatThreshold) {
      let $$repetitiveThresholdModel = getLanguageIntent('$$repetitiveThresholdModel');
      intentModel = $$model[$$repetitiveThresholdModel];
      properties = {}; // reset it from everything else
      properties['overThreshold'] = true;
    }

    if (lodash.isEmpty(intentModel)) {
      return internalUnresolvedResponse();
    }

    // intercept and do some changes here if required
    let results = runDialogInterceptor({ intent, nlp, properties, views });

    // now is time to see for some actions from last time
    for (let action in $$actions) {
      if (Object.prototype.hasOwnProperty.call($$actions, action)) {
        // they all will be used for the next time!
        results.properties[action] = $$actions[action];
      }
    }

    // search for dialog with the modelled properties
    let dialog = findDialogByProperties({ intent: intentModel }, results.properties);

    // get properties defined in the model for the next time use
    let shouldRedirectIntent = '';
    if (dialog && dialog.hasOwnProperty('actions')) {
      // get all that start with $$$ and add them to the $$lastProperties
      for (let action in dialog.actions) {
        if (Object.prototype.hasOwnProperty.call(dialog.actions, action)) {
          if (action === '$gotoIntentNow') {
            shouldRedirectIntent = dialog.actions[action];
            if ("$lastIntent" == shouldRedirectIntent) {
              //shouldRedirectIntent = $$lastIntent;
              shouldRedirectIntent = $lastIntentRemoveIfNotUsed;
            }
          } else {
            // they all will be used for the next time!
            $$actions[action] = dialog.actions[action];
          }
        }
      }
    } else {
      // reset the action if non for next time!!!
      $$actions = {};
    }

    if (!lodash.isEmpty(shouldRedirectIntent)) {
      return generateDialog({ intent: shouldRedirectIntent, nlp: nlp }, results.properties, results.views);
    }



    return (dialog && !lodash.isEmpty(dialog) && dialog['replays']) ?
      getRandomDialog(dialog, results.views) : internalUnresolvedResponse(intentModel);
  };

  let init = function () {
  };

  // init immediately
  init();

  return {
    loadModel: loadModel,
    loadFromFolder: loadFromFolder,
    loadFeatureModel: loadFeatureModel,
    getModel: exportModel,
    getFeatureModel: exportFeatureModel,
    getDialog: generateDialog,
    setDialogInterceptor: setDialogInterceptor,
  };
})();

module.exports = Dialog;
