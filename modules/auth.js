const request = require('request');
const _ = require('lodash');

const dataManager = require("./dataManager");

// configuration
var setup = 'https://p12-setup.icloud.com/setup/ws/1';

var conf = {
    home : 'https://www.icloud.com',
    setup : setup,
    login : setup + "/login",
    validate : setup + "/validate",
}

let authCookie = []

// default request object
var req = request.defaults({ 
    headers : {
        'host': 'setup.icloud.com',
        'origin' : conf.home,
        'referer' : conf.home,
        'User-Agent': 'Opera/9.52 (X11; Linux i686; U; en)'
    },
    jar : true,
    json : true
});

// store various request meta credentials 
var session = { params : {
    clientBuildNumber : '14FPlus30',
    clientId : dataManager.generateUuid()
} };

/*
Queries the /validate endpoint and fetches two key values we need:
1. "dsInfo" is a nested object which contains the "dsid" integer.
    This object doesn't exist until *after* the login has taken place,
    the first request will complain about a X-APPLE-WEBAUTH-TOKEN cookie
*/
function refresh_validate(cb) {

    // make the request via the session params
    req.get({ 
        url : conf.validate,
        qs : session.params
    }, function(err, resp, data) {
        if (err) return cb(err);

        // capture the dsid 
        if (data.dsInfo) { session.params.dsid = data.dsInfo.dsid; }

        cb(null);
    });
}

const auth = module.exports = {}


module.exports.login = function(apple_id, password) {
    return new Promise( (resolve, reject) => {
        // store the user info
        session.user = { 
            apple_id : apple_id,
            password : password
        }

        // validate before login
        refresh_validate(function(err, results) {
            if (err) return cb(err);

            // craft data for login request
            var data = _.clone(session.user);
            data.id = session.params.id;
            data.extended_login = false;

            // login request
            req.post({ 
                url : conf.login,
                qs : session.params,
                json: data
            }, function(err, resp, data) {
                if (err || data.error) 
                    return reject("Invalid email/password combination.");
                
                // store the results
                session.discovery = data;
                session.webservices = data.webservices;

                authCookie = resp.headers['set-cookie'];

                // refresh after login
                refresh_validate((err, res) => {
                    if(err) reject(err);
                    else resolve(res);
                });
            });
        });
    })        
}

module.exports.session = session;

module.exports.getCookie = function() {
    return authCookie.join("; ");
}

module.exports.getServiceUrl = function(serviceName) {
    return auth.session.webservices[serviceName].url.split('//')[1].split(':')[0];
}