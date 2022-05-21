const uuid = require("uuid");
const { configuration } = require("./config");

// Convert the inactiveServerRemovalMinutes to milliseconds
const inactiveServerRemovalMs = configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000;

// If we're going to send the remaining server life in seconds, we need to run the prune every second
// Otherwise , just run it half of whaterver the inactiveServerRemovalMinutes is set to.
const pruneInterval = configuration.Pruning.sendNextPruneTimeInSeconds
  ? 1000
  : inactiveServerRemovalMs / 2;

// Generates a UUID for a newly added server.
function generateUuid(serverArray) {
  var generatedUuid = uuid.v4();
  var doesExist = serverArray.filter((server) => server.uuid === generatedUuid); // Used for collision check

  if (doesExist.length > 0) {
    generateUuid();
  }

  return generatedUuid;
}

module.exports = { generateUuid, inactiveServerRemovalMs, pruneInterval };
