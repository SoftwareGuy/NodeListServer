//-------
// Validators: Put request validators to be used in the requestHandler module here
// They should return an object with the following properties:
// passed: boolean - true if the request passed, false if not
// logMessage: string - To log the message to the console
// status: number - To return a specific response status code to the client
//-------

// No post body check
function requestIncludesBody(req) {
  if (!req.body) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" denied from ${req.ip}: No POST body data?`,
      status: 400,
    };
  }
}

function accessControlCheck(req, useAccessControl, allowedServerAddresses) {
  if (useAccessControl && !allowedServerAddresses.includes(req.ip)) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" blocked from ${req.ip}. They are not known in our allowed IPs list.`,
      status: 403,
    };
  }
}

// Uuid provided but doesn't exist (/add).
function uuidProvidedButDoesNotExist(req, serverArray) {
  if (
    req.body.serverUuid &&
    !serverArray.filter((server) => server.uuid === req.body.serverUuid.trim()).length > 0
  )
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No such server with UUID '${req.body.serverUuid}'`,
      status: 400,
    };
}

// Server Name checking (/add)
function serverNameCheck(req, serverArray, allowDuplicateServerNames) {
  // Check to make sure the server name isn't null.
  if (!req.body.serverName) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server name is null/undefined.`,
      status: 400,
    };
  }

  // Check if we have duplicates and if they are allowed
  if (
    !allowDuplicateServerNames &&
    serverArray.some((server) => server.name === req.body.serverName.trim())
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server name clashes with an existing server name.`,
      status: 400,
    };
  }
}

// Valid port provided?
function serverPortCheck(req) {
  // Now we need to check to ensure the server port isn't out of bounds.
  // Port 0 doesn't exist as per se, so we need to make sure we're valid.

  if (
    !req.body.serverPort ||
    isNaN(req.body.serverPort) ||
    req.body.serverPort < 1 ||
    req.body.serverPort > 65535
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server port is undefined, below 1 or above 65335.`,
      status: 400,
    };
  }
}

function serverCollisionCheck(req, serverArray) {
  // Check if the server already exists.
  if (
    !req.body.serverUuid &&
    serverArray.some((server) => server.ip === req.ip && server.port === +req.body.serverPort)
  ) {
    return {
      passed: false,
      logMessage: `Request from ${req.ip} denied: Server collision! We're attempting to add a server that's already known.`,
      status: 400,
    };
  }
}

// No server uuid provided
function serverUuidExists(req, serverArray) {
  if (!req.body.serverUuid) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No UUID provided`,
      status: 400,
    };
  }
  if (!serverArray.some((server) => server.uuid === req.body.serverUuid.trim())) {
    return {
      passed: false,
      logMessage: `Request to "${req.path}" from ${req.ip} denied: No such server with UUID '${req.body.serverUuid}'`,
      status: 400,
    };
  }
}

module.exports = {
  uuidProvidedButDoesNotExist,
  serverNameCheck,
  serverPortCheck,
  serverCollisionCheck,
  serverUuidExists,
  requestIncludesBody,
  accessControlCheck,
};
