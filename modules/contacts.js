const req = require('request');
const _ = require('lodash');

const auth = require('./auth');

/**
 *  Function to fetch contacts
 */ 
module.exports.get = function(data) {
    return new Promise( (resolve, reject) => {
        auth.login('contacts', data.login, data.password)
            .then(response => {
                const params = _.extend({}, response.session.params, {
                    clientVersion: "5.1",
                    locale: "en_US",
                    order: "last,first"
                });

                req.get({
                    url: `https://${response.serviceUrl}/co/startup`,
                    qs: params,
                    headers: {
                        host: response.serviceUrl,
                        Cookie: response.authCookie,
                        Origin: "https://www.icloud.com"
                    }
                }, function(err, resp, body) {
                    if (err) reject(err);
                    else resolve(JSON.parse(body).contacts);
                });
            })
            .catch(reject)        
    })
}