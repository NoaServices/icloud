const request = require('request-promise');
const _ = require('lodash');
const moment = require('moment');
const co = require('co');
const auth = require('./auth');

const dataManager = require('./dataManager');

const calendar = module.exports = {};

/**
 * Function forms default headers adding cookie
 */
function _getDefaultHeaders(cookie, serviceUrl) {
  return {
    'Content-Type': 'text/plain',
    'Connection': 'keep-alive',
    'host': serviceUrl,
    'Cookie': cookie,
    'Origin': "https://www.icloud.com",
    'Referer': 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
    "Accept-Language" : "en-US,en;q=0.8",
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
  };
}

/**
 * Function forms basic query params
 */
function _getDefaultParams(data) {
  const result = {
    lang: 'en-us',
    usertz: "UTC",
    requestID: dataManager.generateId()
  };

  if (data.startDate) result.startDate = data.startDate;
  if (data.endDate) result.endDate = data.endDate;

  return result;
}

/**
 * Function to get calendar events
 */
module.exports.getEvents = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) { 
      const res = yield auth.login(data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _getEvents(data, cookie, dsid);
  })();
};

function _getEvents(data, cookie, dsid) {
  const session = _.extend(auth.getBasicSession(data.login, data.password));
  session.params.dsid = dsid;
  const serviceUrl = auth.getServiceUrl('calendar');
  
  return request.get({
    url: `https://${serviceUrl}/ca/events`,
    resolveWithFullResponse: true,
    qs : _.extend({}, session.params, _getDefaultParams(data)),
    headers : _getDefaultHeaders(cookie, serviceUrl)
  });
}

/**
 * Get event details
 */
module.exports.getEventDetails = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) { 
      const res = yield auth.login(data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _getEventDetails(data, cookie, dsid);
  })();
};

function _getEventDetails(data, cookie, dsid) {
  const session = _.extend(auth.getBasicSession(data.login, data.password));
  session.params.dsid = dsid;
  const serviceUrl = auth.getServiceUrl('calendar');
  
  return request.get({
    url: `https://${serviceUrl}/ca/eventdetail/${data.type}/${data.guid}`,
    resolveWithFullResponse: true,
    qs : _.extend({}, session.params, _getDefaultParams(data)),
    headers : _getDefaultHeaders(cookie, serviceUrl)
  });
}

/**
 * Function that obtains the list of user calendars
 */
module.exports.getList = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) {
      const res = yield auth.login(data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _getList(data, cookie, dsid);
  })();
}

function _getList(data, cookie, dsid) {
  const session = _.extend(auth.getBasicSession(data.login, data.password));
  session.params.dsid = dsid;

  const serviceUrl = auth.getServiceUrl('calendar');
  return request.get({
    url: `https://${serviceUrl}/ca/startup`,
    resolveWithFullResponse: true,
    qs : _.extend({}, session.params, _getDefaultParams(data)),
    headers : _getDefaultHeaders(cookie, serviceUrl)
  });
}    

/**
 * Function to create calendar event
 */
module.exports.createEvent = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) {
      const res = yield auth.login(data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _createEvent(data, cookie, dsid);
  })();  
}

function _createEvent(data, cookie, dsid) {  
  const session = _.extend(auth.getBasicSession(data.login, data.password));
  session.params.dsid = dsid;

  if (!data.guid) data.guid = dataManager.generateUuid();

  const qs = _.extend({}, session.params, _getDefaultParams(data));
  qs.startDate = moment().day("Sunday").hour(0).minute(0).format('YYYY-MM-DD');
  qs.endDate = moment().day("Saturday").hour(23).minute(59).format('YYYY-MM-DD');
  const serviceHost = auth.getServiceUrl('calendar');
  
  return request({
    method: "POST",
    json: true,
    resolveWithFullResponse: true,
    body: dataManager.createDummyReqObj(data),
    url: `https://${serviceHost}/ca/events/${data.type}/${data.guid}`,
    qs,
    headers: _getDefaultHeaders(cookie, serviceHost)
  });
}

/**
 * Function that updates calendar event
 */
module.exports.updateEvent = function(data, cookie, dsid) {
    return calendar.createEvent(data, cookie, dsid);
}

/**
 * Function to delete calendar event
 */
module.exports.deleteEvent = function(data, cookie, dsid) {
  return co.wrap(function*() {
    if (!cookie || !dsid) {
      const res = yield auth.login(data.login, data.password);
      cookie = res.cookie;
      dsid = res.dsid;
    }
    return yield _deleteEvent(data, cookie, dsid);
  })();
}

function _deleteEvent(data, cookie, dsid) {
  const session = _.extend(auth.getBasicSession(data.login, data.password));
  session.params.dsid = dsid;

  const qs = _.extend({}, session.params, _getDefaultParams(data));

  qs.startDate = moment(data.startDate[0]).day("Sunday").hour(0).minute(0).format('YYYY-MM-DD');
  qs.endDate = moment(data.endDate[0]).day("Saturday").hour(23).minute(59).format('YYYY-MM-DD');
  qs.methodOverride = "DELETE";

  const serviceUrl = auth.getServiceUrl('calendar');
  return request({
      method: "POST",
      json: true,
      body: {
          ClientState: dataManager.createClientState(data),
          Event: {}
      },
      url: `https://${serviceUrl}/ca/events/${data.type}/${data.guid}`,
      qs,
      resolveWithFullResponse: true,
      headers: _getDefaultHeaders(cookie, serviceUrl)
  });
}