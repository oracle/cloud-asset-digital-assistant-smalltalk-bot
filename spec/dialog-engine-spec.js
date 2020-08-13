/**
 * Copyright (c) 2020, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
var path = require('path');
var debug = require('debug');
var log = debug(__filename.split(path.sep).pop());

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var assert = require('assert');

// the dialog engine
var dialog = undefined;

describe('Spec Engine', function () {
  this.timeout(60000);

  before(function () {
    dialog = require("../services/dialog");
    log("dialog engine spec");
    dialog.loadFromFolder("dialogtestresponsemodels/smalltalk", __dirname);
  });

  describe('basic engine tasks', function () {
    it('should load different dialogs', function () {

      let d1 = dialog.getDialog({ intent: 'Greeting' });
      log(d1);

      let d2 = dialog.getDialog({ intent: 'Greeting' });
      log(d2);

      d1.should.not.be.equal(d2);
    });

    it('should not return template', function () {

      log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { profile: "pelov" }));
    })
  });
});