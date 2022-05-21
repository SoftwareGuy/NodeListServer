const expressServer = require("express");
const expressApp = expressServer();

const { configuration } = require("./config");
const requestHandlers = require("./requestHandlers");
const knownServers = require("./serverList");

// ----------------
// Security Checks
// ----------------

// - Rate Limiter
//   Note: We check if this is undefined as well as set to true, because we may be
//   using an old configuration ini file that doesn't have the new setting in it.
//   Enabled by default, unless explicitly disabled.
const useRateLimiter =
  !configuration.Security.useRateLimiter || configuration.Security.useRateLimiter;

if (useRateLimiter) {
  const expressRateLimiter = require("express-rate-limit");
  const limiter = expressRateLimiter({
    windowMs: configuration.Security.rateLimiterWindowMs,
    max: configuration.Security.rateLimiterMaxApiRequestsPerWindow,
  });

  console.log("Security: Enabling the rate limiter module.");
  expressApp.use(limiter);
}

// - Access Control List (ACL)
//   Allowed server addresses cache.
var allowedServerAddresses = [];
if (configuration.Auth.useAccessControl) {
  console.log("Security: Beware, Access Control Lists are enabled.");
  allowedServerAddresses = configuration.Auth.allowedIpAddresses;
}

// ----------------
// Middleware functions for handling requests
// ----------------

expressApp.use(expressServer.json());
expressApp.use(expressServer.urlencoded({ extended: true }));
// These are our gatekeepers, requests must pass through these before allowed to access the API.
expressApp.use(requestHandlers.handleErrors);
expressApp.use(requestHandlers.handleAllRequests);
expressApp.use((req, res, next) =>
  requestHandlers.handlePathSpecificRequests(
    req,
    res,
    next,
    knownServers.list,
    allowedServerAddresses
  )
);

module.exports = { expressApp };
