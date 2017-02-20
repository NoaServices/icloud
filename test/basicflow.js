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

co(function*() {
    // const contacts = yield instance.contacts.get({
    //     login: flags.login, 
    //     password: flags.password
    // });

    // console.log("Got contacts: ", contacts.map(el => `${el.firstName} ${el.lastName}`));

    const result = yield instance.calendar.getList({
        login: flags.login, 
        password: flags.password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    });

    console.log('Got calendars list:', result.map(el => el.title));

    const collection = result.pop();

    const res = yield instance.calendar.createEvent({
        login: flags.login,
        password: flags.password,
        startDate: [20170213, 2017, 2, 20, 1, 0, 0],
        endDate: [20170213, 2017, 2, 20, 2, 0, 0],
        title: "New custom even22t",
        participants: [ "hatol@ciklum.com" ],
        type: collection.guid,
        ctag: collection.ctag
    });

    const guid = res.guid;

    console.log(`Created event, guid: ${guid}`);

    const events = yield instance.calendar.getEvents({
        login: flags.login,
        password: flags.password,
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    });

    console.log('Got list of events: ', events.map(el => el.title));

    yield  instance.calendar.updateEvent({
        login: flags.login,
        password: flags.password,
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        title: "Now it becomes updated event",
        participants: [ "hatol@ciklum.com" ],
        type: collection.guid,
        ctag: collection.ctag,
        guid
    });

    console.log('updated event');

    yield instance.calendar.deleteEvent({
        login: flags.login,
        password: flags.password,
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        type: collection.guid,
        ctag: collection.ctag,
        guid: guid
    });

    console.log('deleted event');

})
.catch(console.error);