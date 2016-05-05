/* global KeyServer */

'use strict';

describe('Key server settings unit tests', function() {

  var keyserver, optionsMock, mveloMock;
  var hkpUrl = 'https://keyserver.ubuntu.com';

  beforeEach(function() {
    optionsMock = {l10n:{}, event:{triggerHandler: function() {}}, pgpModel: function() {}};
    mveloMock = {extension: {sendMessage: function() {}}};
    keyserver = new KeyServer(mveloMock, optionsMock);

    keyserver._inputHkpUrl = {val: function() {}};
    keyserver._saveBtn = {prop: function() {}};
    keyserver._cancelBtn = {prop: function() {}};
    keyserver._alert = {showAlert: function() {}};
  });

  afterEach(function() {});

  describe('init', function() {
    it('should work', function() {
      sinon.stub(keyserver, 'loadPrefs');

      keyserver.init();

      expect(keyserver.loadPrefs.calledOnce).to.be.true;
    });
  });

  describe('onChangeHkpUrl', function() {
    beforeEach(function() {
      sinon.stub(keyserver, 'normalize');
      sinon.stub(keyserver._inputHkpUrl, 'val');
      sinon.stub(keyserver._saveBtn, 'prop');
    });

    it('should warn for invalid url', function() {
      keyserver._inputHkpUrl.val.returns('https//keyserver.ubuntu.com');

      expect(keyserver.onChangeHkpUrl()).to.be.false;

      expect(keyserver.normalize.calledOnce).to.be.true;
    });

    it('should enable buttons for valid url', function() {
      keyserver._inputHkpUrl.val.returns(hkpUrl);

      keyserver.onChangeHkpUrl();

      expect(keyserver.normalize.calledOnce).to.be.true;
      expect(keyserver._saveBtn.prop.calledOnce).to.be.true;
    });
  });

  describe('save', function() {
    beforeEach(function() {
      sinon.stub(keyserver, 'normalize');
      sinon.stub(mveloMock.extension, 'sendMessage').yields();
      sinon.stub(optionsMock.event, 'triggerHandler');
      sinon.stub(keyserver._alert, 'showAlert');
    });

    it('should trigger update event on success', function(done) {
      sinon.stub(keyserver, 'testUrl').returns(resolves());

      keyserver.save().then(function() {
        expect(optionsMock.event.triggerHandler.withArgs('hkp-url-update').calledOnce).to.be.true;
        done();
      });
    });

    it('should show error on failure', function(done) {
      sinon.stub(keyserver, 'testUrl').returns(rejects());

      keyserver.save().then(function() {
        expect(optionsMock.event.triggerHandler.called).to.be.false;
        expect(keyserver._alert.showAlert.calledOnce).to.be.true;
        done();
      });
    });
  });

  describe('cancel', function() {
    it('should work', function() {
      sinon.stub(keyserver, 'normalize');
      sinon.stub(keyserver, 'loadPrefs');

      expect(keyserver.cancel()).to.be.false;

      expect(keyserver.normalize.calledOnce).to.be.true;
      expect(keyserver.loadPrefs.calledOnce).to.be.true;
    });
  });

  describe('validateUrl', function() {
    it('should fail for empty string', function() {
      expect(keyserver.validateUrl('')).to.be.false;
    });

    it('should fail for undefined', function() {
      expect(keyserver.validateUrl()).to.be.false;
    });

    it('should fail for hkp://', function() {
      expect(keyserver.validateUrl('hkp://keyserver.ubuntu.com')).to.be.false;
    });

    it('should fail for url with trailing slash', function() {
      expect(keyserver.validateUrl('http://keyserver.ubuntu.com/')).to.be.false;
    });

    it('should fail for url with not just hostname', function() {
      expect(keyserver.validateUrl('http://keyserver.ubuntu.com/asdf/')).to.be.false;
    });

    it('should work for http://', function() {
      expect(keyserver.validateUrl('http://keyserver.ubuntu.com')).to.be.true;
    });

    it('should work for https://', function() {
      expect(keyserver.validateUrl('https://keyserver.ubuntu.com')).to.be.true;
    });
  });

  describe('testUrl', function() {
    beforeEach(function() {
      sinon.stub($, 'get');
    });

    afterEach(function() {
      $.get.restore();
    });

    it('should fail for invalid url', function(done) {
      keyserver.testUrl('https//keyserver.ubuntu.com').catch(function(err) {
        expect(err.message).match(/Invalid url/);
        done();
      });
    });

    it('should fail for 404', function(done) {
      $.get.yields('data', null, {status: 404});

      keyserver.testUrl(hkpUrl).catch(function(err) {
        expect(err.message).match(/not reachable/);
        done();
      });
    });

    it('should fail for 500', function(done) {
      $.get.yields('data', null, {status: 500});

      keyserver.testUrl(hkpUrl).catch(function(err) {
        expect(err.message).match(/not reachable/);
        done();
      });
    });

    it('should work for 200', function(done) {
      $.get.yields('data', null, {status: 200});

      keyserver.testUrl(hkpUrl).then(done);
    });
  });

  describe('loadPrefs', function() {
    it('should work', function(done) {
      sinon.stub(keyserver._inputHkpUrl, 'val');
      sinon.stub(optionsMock, 'pgpModel').returns(resolves({keyserver:{hkp_base_url:hkpUrl}}));

      keyserver.loadPrefs().then(function() {
        expect(keyserver._inputHkpUrl.val.withArgs(hkpUrl).calledOnce).to.be.true;
        done();
      });
    });
  });

});