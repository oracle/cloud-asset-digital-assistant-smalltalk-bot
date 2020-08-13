/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

var log4js = require('log4js');
var logger = log4js.getLogger();

var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var lodash = require('lodash');


//var dialog = require("../dialog").Model();
var dialog = require("../custom/components/dialog-branch-logic");

var smalltalkgreeting = require("../custom/smalltalk.1/smalltalkgreeting");
var smalltalkgreetingquestions = require("../smalltalk/smalltalkgreetingquestions");
var smalltalkformaltimegreeting = require("../smalltalk/smalltalkformaltimegreeting.json");
var smalltalkunresolved = require("../smalltalk/smalltalkunresolved.json");


// load module
dialog.loadModel({});
// SCS_TODO Remove?
// dialog.loadModel(smalltalkgreeting).loadModel(smalltalkgreetingquestions);
// dialog.loadModel(smalltalkformaltimegreeting);
// dialog.loadModel(smalltalkunresolved);
dialog.loadFromFolder("smalltalk");


//logger.debug('Export Model:', dialog.getModel());

console.log("it should show 4 different dialogs");

console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));

//
console.log(dialog.getDialog({ intent: 'Greeting' }, {}, { profile: "Pelov" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, {}, { profile: "Pelov" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, {}, { profile: "Pelov" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, {}, { profile: "Pelov" }));

//
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "whatever" }, { profile: "Pelov" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }, { profile: "Pelov" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }, { profile: "Pelov" }));

//
console.log("#repetitive");
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { repeat: "Hi", profile: "Pelov1" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { repeat: "jo", profile: "Pelov2" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { repeat: "hey", profile: "Pelov3" }));
console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { repeat: "howdy", profile: "Pelov4" }));


dialog.getDialog({ intent = "", nlp = {} } = {}, properties = {}, view = {});

//

console.log(" ### Get one with no properties !!! ");
console.log(dialog.getDialog({ intent: 'Greeting' }));
console.log(dialog.getDialog({ intent: 'Greeting' }));
console.log(dialog.getDialog({ intent: 'Greeting' }));
console.log(dialog.getDialog({ intent: 'Greeting' }));

console.log(dialog.getDialog());
console.log(dialog.getDialog({ intent: 'me' }));

// console.log(" ### Formal time greeting !!! ");
dialog.setDialogPropertiesInterceptor("FormalTimeGreetingMorning", function (intent, nlp, properties) {
  // do some work here
  console.log("$$$$ -> setDialogPropertiesInterceptor1", intent, nlp, properties);
  return { "type": "morning", "failed": true };
  //return properties;
});


dialog.setDialogPropertiesInterceptor("FormalTimeGreetingMorning", function (intent, nlp, properties) {
  console.log("$$$$ -> setDialogPropertiesInterceptor2", intent, nlp, properties);
<<<<<<< HEAD
  // SCS_TODO Remove?
  // if (!lodash.isEmpty(value)) {
  //     value["failed"] = true;
  //     return value;
  // }
  // else {
  //     return {"failed": true};
  // }
=======

>>>>>>> develop
  return properties;
});

// isValid will be the response of the validator, which runs always before that function
// isValid can be only true or false!

dialog.setDialogValidatorInterceptor("FormalTimeGreetingMorning", function (intent, nlp) {
  console.log("set dialog properties", intent, nlp);
  return false;
});

// set the values for the dialog view
// will allow us to build the view properties at global place
dialog.setDialogViewInterceptor({ intent: "FormalTimeGreetingMorning" }, function (intent, nlp, properties, view, isValid) {
  console.log("set dialog VIEW properties", intent, nlp, properties, view, isValid);
});

// global function, that allows you to find the dialog you think match best your needs!

// NOTICE: it will be called after validate, properties and dialog view!

console.log(" ### -> Formal time greeting morning! ");
console.log(dialog.getDialog({ intent: 'FormalTimeGreetingMorning' }, {
  "template": true,
  "validator": false
}, { VALUE: "morning", MESSAGE: "afternoon" }));

console.log(" ### -> unresolved intent! ");

console.log(dialog.getDialog({ intent: '$unresolved' }, {
  "intent": "unresolved"
}));

console.log(dialog.getDialog({ intent: '$unresolved' }, {
  "intent": "unresolved"
}));


dialog.getDialog({ intent: 'Greeting' }, { "type": "whatever" }, { profile: "Pelov" })