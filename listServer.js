/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// NodeListServer: NodeJS-based List Server Application
// Developed by Matt Coburn and project contributors.
// --------------
// This software is MIT Licensed. Copyright (c) 2019 - 2021 Matt Coburn.
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const REVISION_VER = 3;

// ---------------
// Require some essential libraries and modules.
// ---------------
const expressServer = require("express");
const expressApp = expressServer();

// - Import what we need from our other files
const loggerInstance = require("./lib/logger"); // our logger instance
const { generateUuid } = require("./lib/utils"); // some utils
const { configuration } = require("./lib/config"); // our configuration
const requestHandlers = require("./lib/requestHandlers"); // requestHandlers (they check all or any request we specify)

// Security checks
// - Rate Limiter
// Note: We check if this is undefined as well as set to true, because we may be
// using an old configuration ini file that doesn't have the new setting in it.
// Enabled by default, unless explicitly disabled.
const useRateLimiter =
  !configuration.Security.hasOwnProperty("useRateLimiter") || configuration.Security.useRateLimiter;

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
// Allowed server addresses cache.
var allowedServerAddresses = [];

if (configuration.Auth.useAccessControl) {
  console.log("Security: Beware, Access Control Lists are enabled.");
  allowedServerAddresses = configuration.Auth.allowedIpAddresses.split(",");
}

// Make sure we use some other things too.
expressApp.use(expressServer.json());
expressApp.use(expressServer.urlencoded({ extended: true }));

// These are our gatekeepers, requests must pass through these before allowed to access the API.
expressApp.use(requestHandlers.handleErrors);
expressApp.use(requestHandlers.handleAllRequests);
expressApp.use((req, res, next) =>
  requestHandlers.handlePathSpecificRequests(req, res, next, knownServers, allowedServerAddresses)
);

// Server memory array cache.
var knownServers = [];

// apiGetServerList: This handler returns a JSON array of servers to the clients.
function apiGetServerList(req, res) {
  // Shows if keys match for those getting list server details.
  loggerInstance.info(`${req.ip} accepted; communication key matched: '${req.body.serverKey}'`);

  // A client wants the server list. Compile it and send out via JSON.
  var serverList = [];

  // Clean out the old ones.
  knownServers = knownServers.filter((freshServer) => freshServer.lastUpdated >= Date.now());

  // Run a loop though the list.
  knownServers.forEach((knownServer) => {
    // If we're hiding servers from the same IP, filter them out.
    if (configuration.Pruning.dontShowServersOnSameIp) {
      if (knownServer.ip === req.ip) {
        loggerInstance.info(
          `Skipped server '${knownServer.uuid}', reason: looks like it's hosted on the same IP as this client`
        );
        return;
      }
    }

    serverList.push({
      ip: knownServer.ip,
      name: knownServer.name,
      port: parseInt(knownServer.port, 10),
      players: parseInt(knownServer.players, 10),
      capacity: parseInt(knownServer.capacity, 10),
      extras: knownServer.extras,
    });
  });

  // Temporary holder for the server list we're about to send.
  var returnedServerList = {
    count: serverList.length,
    servers: serverList,
    updateFrequency: configuration.Pruning.ingameUpdateFrequency,
  };

  loggerInstance.info(`Replying to ${req.ip} with known server list.`);
  return res.json(returnedServerList);
}

// apiUpdateServerInList: Updates a server in the list.
function apiUpdateServerInList(req, res, serverId) {
  // TODO: Improve this. This feels ugly hack tier and I feel it could be more elegant.
  // If anyone has a PR to improves this, please send me a PR.
  var [updatedServer] = knownServers.filter((server) => server.uuid === serverId);
  var theRemainingStack = knownServers.filter((server) => server.uuid !== serverId);

  // Create an object with our requestData data
  var requestData = {
    name: req.body.serverName?.trim(),
    players: !isNaN(req.body.serverPlayers) && parseInt(req.body.serverPlayers, 10),
    capacity: !isNaN(req.body.serverCapacity) && parseInt(req.body.serverCapacity, 10),
    extras: req.body.serverExtras?.trim(),
    lastUpdated: Date.now() + configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000,
  };

  // Cross-check the request data against our current server values and update if needed
  Object.entries(requestData).forEach(([key, value]) => {
    if (value && value !== updatedServer[key]) {
      updatedServer[key] = value;
    }
  });

  // Push the server back onto the stack.
  theRemainingStack.push(updatedServer);
  knownServers = theRemainingStack;

  loggerInstance.info(
    `Handled update request for server '${updatedServer.uuid}' (${updatedServer.name}) requested by ${req.ip}`
  );
  return res.sendStatus(200); // 200 OK
}

// apiAddToServerList: Adds a server to the list.
function apiAddToServerList(req, res) {
  // Now do we have a UUID already?
  // If we do have a server UUID: Then it's possible we're trying to update the server entry.
  // If we do not have a server UUID: Then it's possible we're trying to register the server entry.
  // If neither, on your bike mate, ya ain't welcome here.
  if (knownServers.some((server) => server.uuid === req.body.serverUuid?.trim()))
    return apiUpdateServerInList(req, res, req.body.serverUuid.trim()); // Hand it over to the update routine.

  // Time to wrap things up.
  var newServer = {
    uuid: generateUuid(knownServers),
    ip: req.ip,
    name: req.body.serverName.trim(),
    port: parseInt(req.body.serverPort, 10),
  };

  // Extra field santitization
  newServer["players"] = parseInt(req.body.serverPlayers, 10) || 0;
  newServer["capacity"] = parseInt(req.body.serverCapacity, 10) || 0;
  newServer["extras"] = req.body.serverExtras?.trim() || "";
  newServer["lastUpdated"] =
    Date.now() + configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000;

  knownServers.push(newServer);

  // Log it and send back the UUID to the client - they'll need it for later.
  loggerInstance.info(
    `Handled add server request from ${req.ip}: ${newServer["uuid"]} ('${newServer["name"]}')`
  );
  return res.send(newServer["uuid"]);
}

// apiRemoveFromServerList: Removes a server from the list.
function apiRemoveFromServerList(req, res) {
  knownServers = knownServers.filter((server) => server.uuid !== req.body.serverUuid);
  loggerInstance.info(
    `Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip}).`
  );
  return res.send("OK\n");
}

// Automatically remove servers when they haven't updated after the time specified in lib/config.js
async function removeOldServers() {
  knownServers = knownServers.filter((freshServer) => freshServer.lastUpdated >= Date.now());
  setTimeout(removeOldServers, configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000);
}

removeOldServers();

// -- Start the application -- //
// Attach the functions to each path we use with NodeLS.
expressApp.post("/list", apiGetServerList);
expressApp.post("/add", apiAddToServerList);
expressApp.post("/remove", apiRemoveFromServerList);

// Finally, start the application
console.log(`Welcome to NodeListServer Generation 2 Revision ${REVISION_VER}`);
console.log(
  "Report bugs and fork the project on GitHub: https://github.com/SoftwareGuy/NodeListServer"
);

expressApp.listen(configuration.Core.listenPort, configuration.Core.ipV4 ? "0.0.0.0" : "::", () =>
  console.log(`NodeLS is now listening on port ${configuration.Core.listenPort}.`)
);
