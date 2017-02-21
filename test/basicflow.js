const instance =  require('../index');
const co = require('co');

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

co(function*() {
    const {cookie, dsid} = yield instance.auth.login(login, password);

    let response = yield instance.contacts.get({login, password}, cookie, dsid);

    const contacts = JSON.parse(response.body).contacts;
    console.log("Got contacts: ", contacts.map(el => `${el.firstName} ${el.lastName}`));

    response = yield instance.calendar.getList({
        login, 
        password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    }, cookie, dsid);
    
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
    }, cookie, dsid);

    const guid = response.body.guid;

    console.log(`Created event, guid: ${guid}`);

    response = yield instance.calendar.getEvents({
        login,
        password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    }, cookie, dsid);

    const events = JSON.parse(response.body).Event;
    
    response = yield instance.calendar.getEventDetails({
        login,
        password,
        type,
        guid
    }, cookie, dsid);
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
    }, cookie, dsid);

    console.log('updated event');

    yield instance.calendar.deleteEvent({
        login,
        password,
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        type,
        ctag,
        guid
    }, cookie, dsid);

    console.log('deleted event');

})
.catch(console.error);