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

/*
Queries the /validate endpoint and fetches two key values we need:
1. "dsInfo" is a nested object which contains the "dsid" integer.
  This object doesn't exist until *after* the login has taken place,
  the first request will complain about a X-APPLE-WEBAUTH-TOKEN cookie
*/
function refresh_validate(session, cb) {

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

module.exports.getBasicSession = function() {
  return { 
    params : {
      clientBuildNumber : '14FPlus30',
      clientId : dataManager.generateUuid()
    }
  };
}

module.exports.login = function(serviceName, apple_id, password) {
    return new Promise( (resolve, reject) => {        
        // store various request meta credentials 
        const session = auth.getBasicSession(apple_id, password);
        session.user = { apple_id, password };
        
        // validate before login
        refresh_validate(session, function(err, results) { 
            if (err) return reject(err);

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
                
                // refresh after login
                refresh_validate(session, (err, res) => {
                    if(err) reject(err);
                    else {
                        resolve({
                            cookie: resp.headers['set-cookie'].join("; "),
                            dsid: session.params.dsid,
                            serviceUrl: data.webservices[serviceName].url.split('//')[1].split(':')[0]
                        });
                    }
                });
            });
        });
    });
};