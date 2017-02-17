const request = require('request');
const _ = require('lodash');
const moment = require('moment');

const auth = require('./auth');

const dataManager = require('./dataManager');

const calendar = module.exports = {};

/**
 * Function to get calendar events
 */
module.exports.getEvents = function(data) {
    return new Promise( (resolve, reject) => {
        auth.login('calendar', data.login, data.password)
            .then(response => {
                 const params = _.extend({}, response.session.params, {
                    lang: 'en-us',
                    usertz: "US/Pacific",
                    startDate: data.startDate,
                    endDate: data.endDate
                });

                request.get({
                    url: `https://${response.serviceUrl}/ca/events`,
                    qs : params,
                    headers : {
                        'Content-Type': 'text/plain',
                        'Connection': 'keep-alive',
                        'host': response.serviceUrl,
                        'Cookie': response.authCookie,
                        'Origin': "https://www.icloud.com",
                        'Referer': 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
                        "Accept-Language" : "en-US,en;q=0.8"
                    }
                }, function(err, resp, body) {
                    if (err) return reject(err);
                    else resolve(JSON.parse(body).Event);
                });
            })
            .catch(reject)
    })        
}

/**
 * Function that obtains the list of user calendars
 */
module.exports.getList = function(data) {
    return new Promise( (resolve, reject) => {
        auth.login('calendar', data.login, data.password)
            .then( response => {
                const params = _.extend({}, response.session.params, {
                    lang: 'en-us',
                    usertz: "US/Pacific",
                    requestID: dataManager.generateId(),
                    startDate: data.startDate,
                    endDate: data.endDate
                });
                
                request.get({
                    url: `https://${response.serviceUrl}/ca/startup`,
                    qs : params,
                    headers : {
                        'Content-Type': 'text/plain',
                        'Connection': 'keep-alive',
                        'Cookie': response.authCookie,
                        'host': response.serviceUrl,
                        'Origin': 'https://www.icloud.com',
                        'Referer': 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
                        'Accept-Language' : 'en-US,en;q=0.8'
                    }
                }, function(err, resp, body) {
                    if (err) return reject(err);
                    else resolve(JSON.parse(body).Collection);
                });
            })
            .catch(reject)        
    })
}    

/**
 * Function to create calendar event
 */
module.exports.createEvent = function(data) {
    return new Promise( (resolve, reject) => {
        auth.login('calendar', data.login, data.password)
            .then(response => {
                const params = _.extend({}, response.session.params, {
                    lang: 'en-us',
                    usertz: "US/Pacific",
                    requestID: dataManager.generateId(),
                    startDate: moment(data.startDate[0]).day("Sunday").hour(0).minute(0).format('YYYY-MM-DD'),
                    endDate: moment(data.endDate[0]).day("Saturday").hour(23).minute(59).format('YYYY-MM-DD')
                });
                
                if (!data.guid) data.guid = dataManager.generateUuid();

                const serviceHost = response.serviceUrl;

                request({
                    method: "POST",
                    json: true,
                    body: dataManager.createDummyReqObj(data),
                    url: `https://${serviceHost}/ca/events/${data.type}/${data.guid}`,
                    qs: params,
                    headers: {
                        Cookie: response.authCookie,
                        Origin:"https://www.icloud.com",
                        host: serviceHost,
                        Referer: 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
                        Connection: 'keep-alive',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                    },
                    callback: function(err, resp, body) {
                        if(err) reject(err);
                        else resolve(body);
                    }
                })
            })
            .catch(reject)        
    })        
}

/**
 * Function that updates calendar event
 */
module.exports.updateEvent = function(data) {
    return calendar.createEvent(data);
}

/**
 * Function to delete calendar event
 */
module.exports.deleteEvent = function(data) {
    return new Promise( (resolve, reject) => {
        auth.login('calendar', data.login, data.password)
            .then(response => {
                const params = _.extend({}, response.session.params, {
                    lang: 'en-us',
                    usertz: "US/Pacific",
                    requestID: dataManager.generateId(),
                    startDate: moment(data.startDate[0]).day("Sunday").hour(0).minute(0).format('YYYY-MM-DD'),
                    endDate: moment(data.endDate[0]).day("Saturday").hour(23).minute(59).format('YYYY-MM-DD'),
                    methodOverride: "DELETE"
                });

                request({
                    method: "POST",
                    json: true,
                    body: {
                        ClientState: dataManager.createClientState(data),
                        Event: {}
                    },
                    url: `https://${response.serviceUrl}/ca/events/${data.type}/${data.guid}`,
                    qs: params,
                    headers: {
                        Cookie: response.authCookie,
                        Origin:"https://www.icloud.com",
                        host: response.serviceUrl,
                        Referer: 'https://www.icloud.com/applications/calendar/current/en-us/index.html',
                        Connection: 'keep-alive',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                    },
                    callback: function(err, resp, body) {
                        if(err) reject(err);
                        else resolve(body);
                    }
                })
            })
            .catch(reject)
    })
}