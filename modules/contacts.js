const req = require('request-promise');
const _ = require('lodash');
const Promise = require('bluebird');

const auth = require('./auth');

/**
 *  Function to fetch contacts
 */ 
module.exports.get = function(data, ctx) {
  const session = auth.getBasicSession();
  const host = ctx.serviceUrl;
  const qs = _.extend({}, session.params, {
    clientVersion: "5.1",
    locale: "en_US",
    order: "last,first"
  });
  qs.dsid = ctx.dsid;

  return req.get({
    url: `https://${host}/co/startup`,
    qs,
    resolveWithFullResponse: true,
    headers: {
      host,
      Cookie: ctx.cookie,
      Origin: "https://www.icloud.com"
    }
  });
}