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

describe('Load SmallTak Model', function () {
  this.timeout(60000);

  before(function () {
    dialog = require("../services/dialog");
  });

  describe('model basic tests', function () {
    it('should have default mode', function () {
      //this.skip();
      dialog.loadFromFolder("dialogtestresponsemodels/smalltalk", __dirname);
      let model = dialog.getModel();
      log(model);

      // should have module
      model.should.have.property('$$$unresolved');
      model.should.have.property('Greeting');
      model.should.have.property('FormalTimeGreetingMorning');
      model.should.have.property('$unresolved');
    });

    it('should load feature model', function () {
      //var featureModel = require("./dialogtestresponsemodels/features/feature-1.json");
      dialog.loadFromFolder("dialogtestresponsemodels/features", __dirname, true);

      // get the model again, insight now I should be able to see the $$textChunk
      let model = dialog.getFeatureModel();
      log("show the feature model");
      log(model);

      model.should.have.property('buy');
      model.should.have.property('greeting');
      model.should.have.property('positive');
      model.should.have.property('negative');
      model.should.have.property('neutral');
      model.should.have.property('repeating');
      model.should.have.property('re-repeating');
    });

    it('double-check the model is there', function () {

      // get the model again, insight now I should be able to see the $$textChunk
      let model = dialog.getFeatureModel();
      log("double check the model is there again");
      log(model);

      model.should.have.property('buy');
      model.should.have.property('greeting');
      model.should.have.property('positive');
      model.should.have.property('negative');
      model.should.have.property('neutral');
      model.should.have.property('repeating');
      model.should.have.property('re-repeating');
    });

    it('should not return template', function () {
      log(dialog.getDialog({ intent: 'Greeting' }, { "type": "repetitive" }, { profile: "pelov" }));
    })
  });
});