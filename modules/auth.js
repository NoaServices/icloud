const request = require('request');
const _ = require('lodash');
const dataManager = require("./dataManager");

// configuration
var setup = 'https://p12-setup.icloud.com/setup/ws/1';

var conf = {
  home: 'https://www.icloud.com',
  setup: setup,
  login: setup + "/login",
  validate: setup + "/validate",
  logout: setup + "/logout",
}

// default request object
var req = request.defaults({
  headers: {
    'host': 'setup.icloud.com',
    'origin': conf.home,
    'referer': conf.home,
    'User-Agent': 'Opera/9.52 (X11; Linux i686; U; en)'
  },
  jar: true,
  json: true
});

/*
 * Queries the /validate endpoint and fetches two key values we need:
 * 1. "dsInfo" is a nested object which contains the "dsid" integer.
 * This object doesn't exist until *after* the login has taken place,
 * the first request will complain about a X-APPLE-WEBAUTH-TOKEN cookie
 * 
 * @param {Object} session
 */
function refresh_validate(session) {
  return new Promise((resolve, reject) => {
    // make the request via the session params
    req.get({
      url: conf.validate,
      qs: session.params
    }, function (err, resp, data) {
      if (err) return cb(err);

      // capture the dsid 
      if (data.dsInfo && (data.dsInfo.appleId === session.user.apple_id ||
          data.dsInfo.appleIdAliases.find(alias => alias === session.user.apple_id))) {
        session.params.dsid = data.dsInfo.dsid;
        resolve({ ok: true });
      } else {
        resolve({ ok: true });
      }
    });
  });
}

/**
 * Log out current user with current dsid
 */
function logout() {
  return new Promise((resolve, reject) => {
    req.get({
      url: conf.logout
    }, function (err, resp, data) {
      if (err) throw new Error(err);
      resolve({ sucess: true });
    });
  });
}

const auth = module.exports = {}

/**
 * Get basic session
 * Make sure the previous user is logged out
 */
module.exports.getAsyncBasicSession = () => {
  return new Promise((resolve, reject) => {
    logout().then(() => {
      resolve({
        params: {
          clientBuildNumber: '14FPlus30',
          clientId: dataManager.generateUuid()
        }
      });
    });
  });
}

module.exports.getBasicSession = function () {
  return {
    params: {
      clientBuildNumber: '14FPlus30',
      clientId: dataManager.generateUuid()
    }
  };
}

module.exports.login = function (serviceName, apple_id, password) {
  return new Promise((resolve, reject) => {
    // store various request meta credentials 
    auth.getAsyncBasicSession(apple_id, password).then(session => {
      session.user = { apple_id, password };

      // validate before login
      refresh_validate(session).then(function (results) {
        // craft data for login request
        var data = _.clone(session.user);
        data.id = session.params.id;
        data.extended_login = false;

        // login request
        req.post({
          url: conf.login,
          qs: session.params,
          json: data
        }, function (err, resp, data) {
          if (err || data.error)
            return reject("Invalid email/password combination.");

          // refresh after login
          refresh_validate(session).then(res => {
            resolve({
              cookie: resp.headers['set-cookie'].join("; "),
              dsid: session.params.dsid,
              serviceUrl: data.webservices[serviceName].url.split('//')[1].split(':')[0]
            });
          }).catch(err => {
            reject(err);
          });
        });
      }).catch(err => {
        return reject(err);
      });
    });
  });
};
