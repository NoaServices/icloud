const req = require('request');

const auth = require('./auth');
const session = auth.session;

/**
 *  Function to fetch contacts
 */ 
module.exports.get = function() {
    return new Promise( (resolve, reject) => {
        var params = _.extend({}, session.params, {
            clientVersion: "5.1",
            locale: "en_US",
            order: "last,first"
        });

        var url = auth.getServiceUrl('contacts');

        req.get({
            url: url + "/co/startup",
            qs: params,
            headers: {
                host: url,
            }
        }, function(err, resp, body) {
            if (err) return cb(err);
            cb(null, body);
        });
    })
}