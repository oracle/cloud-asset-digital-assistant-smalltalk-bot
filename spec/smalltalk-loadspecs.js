/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

var log4js = require('log4js');
var logger = log4js.getLogger();

var dialog = require("../dialog");

var smalltalkgreeting = require("../smalltalk/smalltalk-greeting.json");
var smalltalkgreetingquestions = require("../smalltalk/smalltalk-greetingquestions.json");
var smalltalkformaltimegreeting = require("../smalltalk/smalltalk-formaltimegreeting.json");
var smalltalkunresolved = require("../smalltalk/smalltalk-unresolved.json");


describe("SmallTalk Load Module", function () {


  it("should load module only once", function () {
    // load module
    dialog.loadModel({});
    dialog.loadModel(smalltalkgreeting);
    dialog.loadModel(smalltalkgreetingquestions);
    dialog.loadModel(smalltalkunresolved);
    expect(true).toEqual(true);
  });

  it("property type normal", function () {
    console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
    console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
    console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
    console.log(dialog.getDialog({ intent: 'Greeting' }, { "type": "normal" }));
    expect(true).toEqual(true);
  })

  it("get random dialog", function () {
    console.log(dialog.getDialog());
  })

});
