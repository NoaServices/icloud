const uuid = require('node-uuid');

const dataManager = module.exports = {}

module.exports.createDummyReqObj = function(data) {
    const inviteesGuids = (data.participants || []).map(el => uuid.v1().toUpperCase());        

    const reqData = {
        ClientState: dataManager.createClientState(data),
        Event: {
            allDay: false, 
            changeRecurring: null,
            duration: 60,
            description: data.description || '',
            endDate: data.endDate,
            extendedDetailsAreIncluded: true,
            guid: data.guid,
            hasAttachments: false,
            icon: 0,
            invitees: inviteesGuids,
            isJunk: false,
            localEndDate: data.endDate,
            localStartDate: data.startDate,
            location: data.location || '',
            pGuid: data.type,
            recurrenceException: false,
            recurrenceMaster: false,
            startDate: data.startDate,
            title: data.title,
            tz: data.timezone || "UTC"
        }
    };

    if(inviteesGuids.length) {
        reqData.Invitee = data.participants.map((el, i) => {
            return {
                email: el,
                guid: inviteesGuids[i],
                inviteeStatus: "NEEDS-ACTION",
                isMe: false,
                isOrganizer: false,
                pGuid: dataManager.generateUuid(),
                role: "REQ-PARTICIPANT"
            }
        });

        reqData.saveToMailbox = false;
    }

    return reqData;
}

module.exports.createClientState = function(data) {
    return {
        Collection: [{
            ctag: data.ctag,
            guid: data.type
        }],
        alarmRange: 60,
        fullState: false,
        userTime: 1234567890
    }
}

module.exports.generateId = function() {
  min = Math.ceil(10);
  max = Math.floor(100);
  return Math.floor(Math.random() * (30 - 10)) + 10;
}

module.exports.generateUuid = function() {
    return uuid.v1().toUpperCase();
}