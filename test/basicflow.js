const instance =  require('../index');
const Promise = require('bluebird');

const args = require('args');

args
    .option('login', 'iCloud account login')
    .option('password', 'iCloud account password')

const flags = args.parse(process.argv);

if (!flags.login || !flags.password) {
    args.showHelp();
    process.exit(1);
}

const login = flags.login;
const password = flags.password;

Promise.coroutine(function*() {
    /**
     * Separate login to each service (issue, but its ok for now)
     */
    let {cookie, dsid, serviceUrl} = yield instance.auth.login('contacts', login, password);
    let response = yield instance.contacts.get({login, password}, {cookie, dsid, serviceUrl});
    const contacts = JSON.parse(response.body).contacts;
    console.log("Got contacts: ", contacts.map(el => `${el.firstName} ${el.lastName}`));

    /**
     * Separate login to each service (issue, but its ok for now)
     */
    const reqData = yield instance.auth.login('calendar', login, password);   
    cookie = reqData.cookie;
    dsid = reqData.dsid;
    serviceUrl = reqData.serviceUrl;

    response = yield instance.calendar.getList({
        login, 
        password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    }, {cookie, dsid, serviceUrl});
    
    const calendarList = JSON.parse(response.body).Collection;

    console.log('Got calendars list:', calendarList.map(el => el.title));

    const collection = calendarList.pop();
    const type = collection.guid;
    const ctag = collection.ctag;

    response = yield instance.calendar.createEvent({
        login,
        password,
        startDate: [20170213, 2017, 2, 20, 1, 0, 0],
        endDate: [20170213, 2017, 2, 20, 2, 0, 0],
        title: "New custom even22t",
        participants: [ "hatol@ciklum.com" ],
        type,
        ctag
    }, {cookie, dsid, serviceUrl});

    const guid = response.body.guid;

    console.log(`Created event, guid: ${guid}`);

    response = yield instance.calendar.getEvents({
        login,
        password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    }, {cookie, dsid, serviceUrl});

    const events = JSON.parse(response.body).Event;
    
    response = yield instance.calendar.getEventDetails({
        login,
        password,
        type,
        guid
    }, {cookie, dsid, serviceUrl});
    const details = JSON.parse(response.body).Event[0];

    console.log('Got event details: ', details);

    yield  instance.calendar.updateEvent({
        login,
        password,
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        title: "Now it becomes updated event",
        participants: [ "hatol@ciklum.com" ],
        type,
        ctag,
        guid
    }, {cookie, dsid, serviceUrl});

    console.log('updated event');

    yield instance.calendar.deleteEvent({
        login,
        password,
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        type,
        ctag,
        guid
    }, {cookie, dsid, serviceUrl});

    console.log('deleted event');

})()