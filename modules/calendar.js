const request = require('request');
const _ = require('lodash');
const moment = require('moment');

const auth = require('./auth');
const session = auth.session;
const dataManager = require('./dataManager');

let serviceUrl = "";
let serviceHost = "";

const calendar = module.exports = {};

function init() {
    serviceHost = auth.getServiceUrl('calendar');
    serviceUrl = `https://${serviceHost}`;    
}

/**
 * Function to get calendar events
 */
module.exports.getEvents = function(data) {
    if(!serviceUrl) init();

    return new Promise( (resolve, reject) => {
        var params = _.extend({}, session.params, {
            lang: 'en-us',
            usertz: "US/Pacific",
        });
        _.extend(params, data);

        request.get({
            url: `${serviceUrl}/ca/events`,
            qs : params,
            headers : {
                'Content-Type': 'text/plain',
                'Connection': 'keep-alive',
                'host': serviceHost,
                'Cookie': auth.getCookie(),
                'Origin': "https://www.icloud.com",
                'Referer': 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
                "Accept-Language" : "en-US,en;q=0.8"
            }
        }, function(err, resp, body) {
            if (err) return reject(err);
            else resolve(JSON.parse(body));
        });
    })        
}

/**
 * Function that obtains the list of user calendars
 */
module.exports.getList = function(data) {
    if(!serviceUrl) init();

    return new Promise( (resolve, reject) => {
        var params = _.extend({}, session.params, {
            lang: 'en-us',
            usertz: "US/Pacific",
            requestID: dataManager.generateId()
        });
        _.extend(params, data);
        
        request.get({
            url: `${serviceUrl}/ca/startup`,
            qs : params,
            headers : {
                'Content-Type': 'text/plain',
                'Connection': 'keep-alive',
                'Cookie': auth.getCookie(),
                'host': serviceHost,
                'Origin': 'https://www.icloud.com',
                'Referer': 'https://www.icloud.com/applications/calendar/current/en-us/index.html?',
                'Accept-Language' : 'en-US,en;q=0.8'
            }
        }, function(err, resp, body) {
            if (err) return reject(err);
            else resolve(JSON.parse(body));
        });
    })
}    

/**
 * Function to create calendar event
 */
module.exports.createEvent = function(data) {
    if(!serviceUrl) init();
    
    return new Promise( (resolve, reject) => {
        var params = _.extend({}, session.params, {
            lang: 'en-us',
            usertz: "US/Pacific",
            requestID: dataManager.generateId(),
            startDate: moment(data.startDate[0]).day("Sunday").hour(0).minute(0).format('YYYY-MM-DD'),
            endDate: moment(data.endDate[0]).day("Saturday").hour(23).minute(59).format('YYYY-MM-DD'),
            clientMasteringNumber: '17A77'
        });
        
        if (!data.guid) data.guid = dataManager.generateUuid();

        request({
            method: "POST",
            json: true,
            body: dataManager.createDummyReqObj(data),
            url: `${serviceUrl}/ca/events/${data.type}/${data.guid}`,
            qs: params,
            headers: {
                Cookie: auth.getCookie(),
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
    if(!serviceUrl) init();

    return new Promise( (resolve, reject) => {
        var params = _.extend({}, session.params, {
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
            url: `${serviceUrl}/ca/events/${data.type}/${data.guid}`,
            qs: params,
            headers: {
                Cookie: auth.getCookie(),
                Origin:"https://www.icloud.com",
                host: serviceHost,
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
}