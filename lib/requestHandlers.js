const validate = require("./validators");
const { loggerInstance } = require("./logger");
const { configuration } = require("./config");

// Our gatekeeper: Any request must pass it's tests before being allowed to continue.
function handleAllRequests(req, res, next) {
  if (!["/list", "/add", "/remove"].includes(req.path)) res.status(401).send("Unauthorized");

  if (!req.body.serverKey || req.body.serverKey !== configuration.Auth.communicationKey)
    return res.status(403).send("Forbidden");

  next();
}

// If you want to specify validators for a specific path, add them here.
// Our validator functions are in the validators.js file.
function handlePathSpecificRequests(req, res, next, knownServers, allowedServerAddresses) {
  // - "/add" and "/remove" specific validations
  if (req.path === "/add" || req.path === "/remove") {
    // Put all the validators we want to check in an array
    const validations = [
      validate.accessControlCheck(req, configuration.Auth.useAccessControl, allowedServerAddresses),
      validate.requestIncludesBody(req),
    ];

    // Now we check them, this returns the first validation fail it finds, or undefined if none
    const failed = validations.find((v) => v?.passed === false);

    // If we found one, log the message it provides and respond with the status code
    if (failed) {
      loggerInstance.warn(failed.logMessage);
      return res.sendStatus(failed.status);
    }

    // - "/add" path specfic validations
    if (req.path == "/add") {
      // Just assigning this to a variable so it doesn't break our array into new lines, I'm OCD like that :P
      const allowDuplicateServerNames = configuration.Security.allowDuplicateServerNames;

      const validations = [
        validate.uuidProvidedButDoesNotExist(req, knownServers),
        validate.serverNameCheck(req, knownServers, allowDuplicateServerNames),
        validate.serverPortCheck(req),
        validate.serverCollisionCheck(req, knownServers),
      ];

      const failed = validations.find((v) => v?.passed === false);

      if (failed) {
        loggerInstance.warn(failed.logMessage);
        return res.status(failed.status).send(failed?.responseMessage || "Bad Request"); // Send the response message if it exists
      }
    }

    // - "/remove" path path specfic validations
    if (req.path == "/remove") {
      const validations = [
        validate.serverUuidProvided(req),
        validate.uuidProvidedButDoesNotExist(req, knownServers),
      ];
      const failed = validations.find((v) => v?.passed === false);
      if (failed) {
        loggerInstance.warn(failed.logMessage);
        return res.sendStatus(failed.status);
      }
    }
  }
  next();
}

// This only runs if the request results in an error
// (prevents stack trace from being displayed to user)
function handleErrors(err, req, res, next) {
  // Handle invalid JSON requests.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    loggerInstance.info(`${req.ip} sent a bad request: '${err}'`);
    return res.status(400).send({ message: "Invalid JSON request" });
  }

  next(); // Continue
}

module.exports = { handleErrors, handleAllRequests, handlePathSpecificRequests };
