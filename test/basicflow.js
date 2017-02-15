const instance =  require('../index');
const co = require('co');

co(function*() {
    yield instance.auth.login(config.login, config.password);
    
    const result = yield instance.calendar.getList({
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    });

    const collection = result.Collection.filter(el => el.title==='lalal')[0];

    const res = yield instance.calendar.createEvent({
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        title: "New custom event",
        participants: [ "hatol@ciklum.com" ],
        type: collection.guid,
        ctag: collection.ctag
    });

    const guid = res.guid;

    const events = yield instance.calendar.getEvents({
        startDate: "2017-01-29",
        endDate: "2017-03-04"
    });

    yield  instance.calendar.updateEvent({
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        title: "Now it becomes updated event",
        participants: [ "hatol@ciklum.com" ],
        type: collection.guid,
        ctag: collection.ctag,
        guid: guid
    });

    yield instance.calendar.deleteEvent({
        startDate: [20170213, 2017, 2, 13, 1, 0, 0, 0],
        endDate: [20170213, 2017, 2, 13, 2, 0, 0, 0],
        type: collection.guid,
        ctag: collection.ctag,
        guid: guid
    });

})
.catch(console.error);