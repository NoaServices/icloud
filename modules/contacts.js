const req = require('request-promise');
const _ = require('lodash');
const co = require('co');

const auth = require('./auth');

/**
 *  Function to fetch contacts
 */ 
module.exports.get = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) {
      const res = yield auth.login('contacts', data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _getContacts(data, cookie, dsid);
  })(); 
}

function _getContacts(data, cookie, dsid) {
  const session = auth.getBasicSession(data.login, data.password);
  const host = auth.getServiceUrl('contacts');
  const qs = _.extend({}, session.params, {
    clientVersion: "5.1",
    locale: "en_US",
    order: "last,first"
  });
  qs.dsid = dsid;

  return req.get({
    url: `https://${host}/co/startup`,
    qs,
    resolveWithFullResponse: true,
    headers: {
      host,
      Cookie: cookie,
      Origin: "https://www.icloud.com"
    }
  });
}