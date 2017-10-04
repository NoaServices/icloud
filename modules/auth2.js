const request = require('request-promise');
const _ = require('lodash');
const dataManager = require('./dataManager');
const Promise = require('bluebird');

module.exports = class Auth2 {
  constructor() {
    // configuration
    const setup = 'https://p12-setup.icloud.com/setup/ws/1';
    this.conf = {
      home: 'https://www.icloud.com',
      setup: setup,
      login: setup + '/login',
      validate: setup + '/validate',
      logout: setup + '/logout',
      sendVerificationCode: setup + '/sendVerificationCode',
      validateVerificationCode: setup + '/validateVerificationCode',
      listDevices: setup + '/listDevices'
    };

    // default request object
    this.req = request.defaults({
      headers: {
        'host': 'setup.icloud.com',
        'origin': this.conf.home,
        'referer': this.conf.home,
        'User-Agent': 'Opera/9.52 (X11; Linux i686; U; en)'
      },
      jar: true,
      json: true
    });

    this.login = Promise.coroutine(this.login.bind(this));
    this._logout = Promise.coroutine(this._logout.bind(this));
    this._getDevice = Promise.coroutine(this._getDevice.bind(this));
    this._authenticate = Promise.coroutine(this._authenticate.bind(this));
    this._refreshValidate = Promise.coroutine(this._refreshValidate.bind(this));
  }

  /**
   * Returns the first device found in the list
   * @param {Object} session 
   */
  *_getDevice(session) {
    const data = yield this.req.get({
      url: this.conf.listDevices,
      qs: session.params
    });
    return data.devices[0];
  }

  /**
   * Trigger a send of verification code to the device
   * @param {Object} session 
   * @param {Object} device 
   */
  _sendVerificationCode(session, device) {
    return this.req.post({
      url: this.conf.sendVerificationCode,
      qs: session.params,
      json: device
    });
  }

  /**
   * Validate the code and mark the device as trusted in order to persist the cookie
   * @param {Object} session 
   * @param {Object} device 
   * @param {String} code 
   */
  _validateVerificationCode(session, device, code) {
    device.verificationCode = code;
    device.trustBrowser = true;
    session.params.trustBrowser = true;
    return this.req.post({
      url: this.conf.validateVerificationCode,
      qs: session.params,
      json: device,
      resolveWithFullResponse: true
    });
  }

  /**
   * Queries the /validate endpoint and fetches two key values we need:
   * 1. 'dsInfo' is a nested object which contains the 'dsid' integer.
   * This object doesn't exist until *after* the login has taken place,
   * the first request will complain about a X-APPLE-WEBAUTH-TOKEN cookie
   * 
   * @param {Object} session
   */
  *_refreshValidate(session) {
    try {
      // make the request via the session params
      const data = yield this.req.get({
        url: this.conf.validate,
        qs: session.params
      });

      // capture the dsid 
      if (data.dsInfo && (data.dsInfo.appleId === session.user.apple_id ||
        data.dsInfo.appleIdAliases.find(alias => alias === session.user.apple_id))) {
        session.params.dsid = data.dsInfo.dsid;
      }
    } catch (error) {
      if (error.statusCode !== 421) throw new Error(error);
    }

  }

  /**
   * Log out current user with current dsid
   */
  *_logout() {
    try {
      yield this.req.get({
        url: this.conf.logout
      });
    } catch (error) {
      if (error.statusCode !== 421) throw new Error(error);
    }
  };

  _getBasicSession() {
    return {
      params: {
        clientBuildNumber: '14FPlus30',
        clientId: dataManager.generateUuid()
      }
    };
  }

  /**
   * Authenticate the provided session
   * @param {Object} session 
   * @param {String} Optional trustCookie 
   */
  *_authenticate(session, trustCookie) {
    // craft data for login request
    const data = _.clone(session.user);
    data.id = session.params.id;
    data.extended_login = false;

    const requestOptions = {
      url: this.conf.login,
      qs: session.params,
      json: data,
      resolveWithFullResponse: true
    };
    if (trustCookie) {
      if (!requestOptions.headers) requestOptions.headers = {};
      requestOptions.headers.Cookie = trustCookie;
    }

    // login request
    const resp = yield this.req.post(requestOptions);
    if (resp.body.error) {
      throw new Error('Invalid email/password combination.');
    }
    session.params.dsid = resp.body.dsInfo.dsid;
    return resp;
  }

  /**
   * Login the user to the service based on the page where user comes from
   * @param {String} serviceName 
   * @param {Object} credentials 
   * @param {Object} params 
   */
  *login(serviceName, credentials, { isSignup, code, trustCookie }) {
    try {
      yield this._logout();

      // store various request meta credentials
      const session = this._getBasicSession();
      session.user = credentials;

      // validate before login
      yield this._refreshValidate(session);

      // login request
      let resp = yield this._authenticate(session, trustCookie);

      // if user enabled 2-Factor Authentication
      // 1. if user comes from signup page, send verification code to device
      // 2. if user comes from validation code page, validate the code
      if (resp.body.hsaChallengeRequired && (isSignup || code)) {
        const device = yield this._getDevice(session);
        if (isSignup) {
          yield this._sendVerificationCode(session, device);
          throw new Error('two-factor-authentication');
        } else {
          const respCode = yield this._validateVerificationCode(session, device, code);
          trustCookie = respCode.headers['set-cookie'].find(cookie => cookie.includes('HSA-TRUST'));
          resp = yield this._authenticate(session, trustCookie);
        }
      }

      // refresh after login
      yield this._refreshValidate(session);

      return {
        cookie: resp.headers['set-cookie'].join('; '),
        dsid: session.params.dsid,
        serviceUrl: resp.body.webservices[serviceName].url.split('//')[1].split(':')[0],
        trustCookie: trustCookie
      };
    } catch (error) {
      throw new Error(error);
    }
  }
};

