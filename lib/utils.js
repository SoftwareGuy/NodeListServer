const uuid = require("uuid");

// Generates a UUID for a newly added server.
function generateUuid(serverArray) {
  var generatedUuid = uuid.v4();
  var doesExist = serverArray.filter((server) => server.uuid === generatedUuid); // Used for collision check

  if (doesExist.length > 0) {
    generateUuid();
  }

  return generatedUuid;
}

// Check how long in seconds until the next purge
// Useful if the client is stuck in IP/Port collision and wants to know how long to wait before adding themselves again.
// @param {number} time - the last time the server list was purged
// @param {number} minutes - minutes interval we have set to purge the server list (inactiveServerRemovalMinutes)
function secondsUntilNextPurge(lastPurgeTime, minutesPurgeInterval) {
  return Math.floor(minutesPurgeInterval * 60 - (Date.now() - lastPurgeTime) / 1000);
}

module.exports = { generateUuid, secondsUntilNextPurge };
