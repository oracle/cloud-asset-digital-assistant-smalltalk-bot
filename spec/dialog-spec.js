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

describe('Initialise Model', function () {
  before(function () {
    dialog = require("../services/dialog");
  });

  describe('model basic tests', function () {
    it('should have default mode', function () {
      log("... and this is from the dialog spec");
      dialog.should.not.equal(undefined);
      dialog.should.not.equal(null);
      dialog.should.not.equal([]);
    });
  });
});