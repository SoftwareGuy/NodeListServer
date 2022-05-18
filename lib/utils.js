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

module.exports = { generateUuid };
