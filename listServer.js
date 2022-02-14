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
const log4js = require("log4js");
const iniParser = require("multi-ini");
const fs = require("fs");
const uuid = require('uuid');

// ---------------
// Used to store our configuration file data.
// ---------------
var configuration;
var logFile = "NodeListServer.log";

// ---------------
// Logging configuration. Feel free to modify.
// ---------------

// Bugfix: If Google App Engine is running NodeLS, we cannot write to the disk, since it's readonly.
// So we run a check to ensure we can write, if not, we just log to console.

// Check if we can write?
fs.access(__dirname, fs.constants.W_OK, function(err) {
  if(err){
	console.warn("Can't write to disk; logging to file will be disabled!");

	// Configure Log4js
	log4js.configure({
	  appenders: {
		'console': { type: 'stdout' },
		default: { type: 'stdout' }
	  },
	  categories: {
		default: { appenders: ['console'], level: 'debug' }
	  }
	});
  } else {
	log4js.configure({
		appenders: {
			'console': { type: 'stdout' },
			default: { type: 'file', filename: logFile, maxLogSize: 1048576, backups: 3, compress: true }
		},
		categories: {
			default: { appenders: ['default', 'console'], level: 'debug' }
		}
	});
  }
});

// Now we get the logger instance.
var loggerInstance = log4js.getLogger('NodeLS');

// Do we have a configuration file?
if (fs.existsSync("config.ini")) {
    configuration = iniParser.read("./config.ini");
    // Use only for checking if configuration is valid, and not in production.
    // console.log(configuration);
} else {
	loggerInstance.error("NodeListServer failed to start due to a missing 'config.ini' file.");
	loggerInstance.error("Please ensure one exists in the directory next to the script file.");
	loggerInstance.error("If you see this message repeatedly, you might have found a bug worth reporting at https://github.com/SoftwareGuy/NodeListServer.");
	loggerInstance.error("Exiting...");
	process.exit(1);
}

// This function was coded on a whim and probably is jank. Improvements welcome,
// especially how to cast a string into a boolean. ie. "true" -> true.
// In C# I would do bool.TryParse or some other cast.
function translateConfigOptionToBool(value) {
	if(typeof value === "undefined" || value === "false")
		return false;
	else
		// Thanks to https://medium.com/geekculture/20-javascript-snippets-to-code-like-a-pro-86f5fda5598e
		return !!value;
}

// Constant references to various modules.
const expressServer = require("express");
const expressApp = expressServer();
const bodyParser = require("body-parser");

// Security checks

// - Rate Limiter
// Note: We check if this is undefined as well as set to true, because we may be
// using an old configuration ini file that doesn't have the new setting in it.
// Enabled by default, unless explicitly disabled.
if(typeof configuration.Security.useRateLimiter === "undefined" || translateConfigOptionToBool(configuration.Security.useRateLimiter)) {
	const expressRateLimiter = require("express-rate-limit");
	const limiter = expressRateLimiter({
		windowMs: configuration.Security.rateLimiterWindowMs,
		max: configuration.Security.rateLimiterMaxApiRequestsPerWindow
	});

	console.log("Security: Enabling the rate limiter module.");
	expressApp.use(limiter);
}

// - Access Control List (ACL)
// Allowed server addresses cache.
var allowedServerAddresses = [];

if(translateConfigOptionToBool(configuration.Auth.useAccessControl)) {
	console.log("Security: Beware, Access Control Lists are enabled.");
	allowedServerAddresses = configuration.Auth.allowedIpAddresses.split(",");
}

// Make sure we use some other things too.
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));

// Server memory array cache.
var knownServers = [];

// Functions used by NodeListServer
// - Utilities
// Generates a UUID for a newly added server.
function generateUuid() {
	var generatedUuid = uuid.v4();
	var doesExist = knownServers.filter((server) => server.uuid === generatedUuid); // Used for collision check

	if(doesExist.length > 0) {
		generateUuid();
	}

	return generatedUuid;
}

// - Authentication
// apiCheckKey: Checks to see if the client specified key matches.
function apiCheckKey(clientKey) {
	if(clientKey === configuration.Auth.communicationKey)
		return true;
	else
		return false;
}

// apiIsKeyFromRequestIsBad: The name is a mouthful, but checks if the key is bad.
function apiIsKeyFromRequestIsBad(req) {
	if(typeof req.body.serverKey === "undefined" || !apiCheckKey(req.body.serverKey))
	{
		loggerInstance.warn(`${req.ip} used a wrong key: ${req.body.serverKey}`);
		return true;
	} else {
		return false;
	}
}

// - Sanity Checking
// apiDoesServerExistByUuid: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByUuid(uuid) {
	var doesExist = knownServers.filter((server) => server.uuid === uuid.trim());

	if(doesExist.length > 0) {
		return true;
	}

	// Fall though.
	return false;
}

// apiDoesServerExist: Checks if the server exists in our cache, by UUID.
function apiDoesServerExistByName(name) {
	var doesExist = knownServers.filter((server) => server.name === name);

	if(doesExist.length > 0) {
		return true;
	}

	// Fall though.
	return false;
}

// apiDoesThisServerExistByAddressPort: Checks if the server exists in our cache, by IP address and port.
function apiDoesThisServerExistByAddressPort(ipAddress, port) {
	var doesExist = knownServers.filter((servers) => (servers.ip === ipAddress.trim() && servers.port === port));
	if(doesExist.length > 0) {
		return true;
	}

	// Fall though.
	return false;
}

// -- Request Handling
// denyRequest: Generic function that denies requests.
function denyRequest (req, res) {
	loggerInstance.warn(`Request from ${req.ip} denied. Tried ${req.method} method on path: ${req.path}`);
	return res.sendStatus(400);
}

// apiGetServerList: This handler returns a JSON array of servers to the clients.
function apiGetServerList(req, res) {
	if(apiIsKeyFromRequestIsBad(req))
	{
		return res.sendStatus(400);
	}
	else
	{
		// Shows if keys match for those getting list server details.
		loggerInstance.info(`${req.ip} accepted; communication key matched: '${req.body.serverKey}'`);
	}

	// A client wants the server list. Compile it and send out via JSON.
	var serverList = [];

	// Clean out the old ones.
	knownServers = knownServers.filter((freshServer) => (freshServer.lastUpdated >= Date.now()));

	// Run a loop though the list.
	knownServers.forEach((knownServer) => {
		// If we're hiding servers from the same IP, filter them out.
		if(translateConfigOptionToBool(configuration.Pruning.dontShowServersOnSameIp)) {
			if(knownServer.ip === req.ip) {
				loggerInstance.info(`Skipped server '${knownServer.uuid}', reason: looks like it's hosted on the same IP as this client`);
				return;
			}
		}

		serverList.push({
			"ip": knownServer.ip,
			"name": knownServer.name,
			"port": parseInt(knownServer.port, 10),
			"players": parseInt(knownServer.players, 10),
			"capacity": parseInt(knownServer.capacity, 10),
			"extras": knownServer.extras
		});
	});

	// Temporary holder for the server list we're about to send.
	var returnedServerList = {
		"count": serverList.length,
		"servers": serverList,
		"updateFrequency": configuration.Pruning.ingameUpdateFrequency
	};

	loggerInstance.info(`Replying to ${req.ip} with known server list.`);
	return res.json(returnedServerList);
}

// apiUpdateServerInList: Updates a server in the list.
function apiUpdateServerInList(req, res) {

	// TODO: Improve this. This feels ugly hack tier and I feel it could be more elegant.
	// If anyone has a PR to improves this, please send me a PR.
	var serverInQuestion = knownServers.filter((server) => (server.uuid === req.body.serverUuid))[0];
	var notTheServerInQuestion = knownServers.filter((server) => (server.uuid !== req.body.serverUuid));

	var updatedServer = [];
	updatedServer["uuid"] = serverInQuestion.uuid;
	updatedServer["ip"] = serverInQuestion.ip;

	updatedServer["port"] = serverInQuestion.port;
	updatedServer["capacity"] = serverInQuestion.capacity;

	if(typeof req.body.serverExtras !== "undefined") {
		updatedServer["extras"] = req.body.serverExtras.trim();
	} else {
		updatedServer["extras"] = serverInQuestion.extras;
	}

	if(typeof req.body.serverName !== "undefined") {
		updatedServer["name"] = req.body.serverName.trim();
	} else {
		updatedServer["name"] = serverInQuestion.name;
	}

	if(typeof req.body.serverPlayers !== "undefined") {
		if(isNaN(parseInt(req.body.serverPlayers, 10))) {
			updatedServer["players"] = 0;
		} else {
			updatedServer["players"] = parseInt(req.body.serverPlayers, 10);
		}
	} else {
		updatedServer["players"] = serverInQuestion.players;
	}

	// Server capacity might have changed, let's update that if needed
	if(typeof req.body.serverCapacity !== "undefined" || !isNaN(req.body.serverCapacity)) {
		updatedServer["capacity"] = parseInt(req.body.serverCapacity, 10);
	}

	updatedServer["lastUpdated"] = (Date.now() + (configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000));

	// Push the server back onto the stack.
	notTheServerInQuestion.push(updatedServer);
	knownServers = notTheServerInQuestion;

	loggerInstance.info(`Updated information for '${updatedServer.name}', requested by ${req.ip}`);
	return res.send(200); // 200 OK
}

// apiAddToServerList: Adds a server to the list.
function apiAddToServerList(req, res) {

	// Doorstopper.
	if(apiIsKeyFromRequestIsBad(req))
		return res.sendStatus(400);

	var potentialExistingServer = false;
	var potentialExistingServerId = "";

	// Check with access control, if that's enabled.
	if(translateConfigOptionToBool(configuration.Auth.useAccessControl) && !allowedServerAddresses.includes(req.ip)) {
		// It's not allowed. On ya bike mate.
		loggerInstance.warn(`Request denied from ${req.ip}: Not in ACL.`);
		return res.sendStatus(403);	// 403 Forbidden
	}

	// Ensure we have post data body. If not, begone.
	if(typeof req.body === "undefined") {
		loggerInstance.warn(`Request denied from ${req.ip}: No POST body data?`);
		return res.sendStatus(400);
	}

	// Now do we have a UUID already?
	// If we do have a server UUID: Then it's possible we're trying to update the server entry.
	// If we do not have a server UUID: Then it's possible we're trying to register the server entry.
	// If neither, on your bike mate, ya ain't welcome here.
	if(typeof req.body.serverUuid != "undefined") {
		console.log("DEBUGGING: Possibly a existing server!");

		potentialExistingServer = true;
		potentialExistingServerId = req.body.serverUuid;
	}

	// If this is a potential existing server...
	if(potentialExistingServer) {
		// Does it really exist, tho?
		if(apiDoesServerExistByUuid(req.body.serverUuid)) {
			console.log("DEBUGGING: Oh wow, it really does exist!");
			
			res.send("It's bloody stubbed mate.");
			// loggerInstance.info(`Update server: '${req.body.serverName}' from ${req.ip}. UUID: '${req.body.serverUuid}'`);
			// apiUpdateServerInList(req, res);
		} else {
			// Too bad. Go home.
			loggerInstance.warn(`Request from ${req.ip} denied: No such server with UUID '${potentialExistingServerId}'`);
			return res.sendStatus(400);
		}
	} else {
		// Must be a new server trying to add itself.
		console.log("DEBUGGING: New server, doesn't potentially exist");
		
		// Check to make sure the server name isn't null.
		if(typeof req.body.serverName === "undefined") {
			loggerInstance.warn(`Request from ${req.ip} denied: Server name is null/undefined.`);
			return res.sendStatus(400);
		}
		
		// If our security setting doesn't allow duplicate server names, then we should check to ensure that 
		// it doesn't clash.
		if(!translateConfigOptionToBool(configuration.Security.allowDuplicateServerNames)) {
			if(apiDoesServerExistByName(req.body.serverName)) {
				loggerInstance.warn(`Request from ${req.ip} denied: Server name clashes with an existing server name.`);
				return res.sendStatus(400);
			}
		}
		
		// Okay, the server name got past our basic checks, stash it.
		// newServer.name = req.body.serverName.trim();
		
		// Now we need to check to ensure the server port isn't out of bounds.
		// Port 0 doesn't exist as per se, so we need to make sure we're valid.
		if(typeof req.body.serverPort === "undefined" || isNaN(req.body.serverPort) || req.body.serverPort < 1 || req.body.serverPort > 65535) {
			loggerInstance.warn(`Request from ${req.ip} denied: Server port is undefined, below 1 or above 65335.`);
			return res.sendStatus(400);
		}
		
		// Check for a sneaky IP address and port collison attempt.
		queriedAddress = req.body.ip ?? req.ip;
		
		if(apiDoesThisServerExistByAddressPort) {
			loggerInstance.warn(`Request from ${req.ip} denied: Server collision! We're attempting to add a server that's already known.");
			return res.sendStatus(400);
		}
		
		// Time to wrap things up.
		var newServer = {
			"uuid": generateUuid(),
			"ip": req.body.ip ?? req.ip,
			"name": req.body.serverName.trim(),
			"port": parseInt(req.body.serverPort, 10),
		};
		
		// Extra field santitization
		newServer["players"] = (typeof req.body.serverPlayers === "undefined" || isNaN(req.body.serverPlayers) ? 0 : parseInt(req.body.serverPlayers, 10);
		newServer["capacity"] = (typeof req.body.serverCapacity === "undefined" || isNaN(req.body.serverCapacity)) ? 0 : parseInt(req.body.serverCapacity, 10);

		newServer["extras"] = (typeof req.body.serverExtras !== "undefined") ? req.body.serverExtras.trim() : "";

		knownServers.push(newServer);
		
		// Log it and send back the UUID to the client - they'll need it for later.
		loggerInstance.info(`Handled add server request from ${req.ip}: ${newServer["uuid"]} ('${newServer["name"]}')`);
		return res.send(newServer["uuid"]);
	}
}

// apiRemoveFromServerList: Removes a server from the list.
function apiRemoveFromServerList(req, res) {
	// Doorstopper.
	if(apiIsKeyFromRequestIsBad(req))
		return res.sendStatus(400);

	// Are we using access control? If so, are they allowed to do this?
	if(translateConfigOptionToBool(configuration.Auth.useAccessControl) && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		loggerInstance.warn(`Remove server request blocked from ${req.ip}. They are not known in our allowed IPs list.`);
		return res.sendStatus(403);
	}

	if(typeof req.body === "undefined") {
		loggerInstance.warn(`Request from ${req.ip} denied: no POST data was provided.`);
		return res.sendStatus(400);
	}

	// Server isn't specified?
	if(typeof req.body.serverUuid === "undefined") {
		loggerInstance.warn(`Request from ${req.ip} denied: Server UUID was not provided.`);
		return res.sendStatus(400);
	}

	if(!apiDoesServerExistByUuid(req.body.serverUuid, knownServers)) {
		loggerInstance.warn(`Request from ${req.ip} denied: Can't delete server with UUID '${req.body.serverUuid}' from cache.`);
		return res.sendStatus(400);
	} else {
		knownServers = knownServers.filter((server) => server.uuid !== req.body.serverUuid);
		loggerInstance.info(`Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip}).`);
		return res.send("OK\n");
	}
}

// Automatically remove servers when they haven't updated after the time specified in the config.ini
async function removeOldServers() {
	knownServers = knownServers.filter((freshServer) => (freshServer.lastUpdated >= Date.now()));
    setTimeout(removeOldServers, configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000);
}

removeOldServers();


// -- Start the application -- //
// Attach the functions to each path we use with NodeLS.
expressApp.get("/", denyRequest);
expressApp.post("/list", apiGetServerList);
expressApp.post("/add", apiAddToServerList);
expressApp.post("/remove", apiRemoveFromServerList);

// Finally, start the application
console.log(`Welcome to NodeListServer Generation 2 Revision ${REVISION_VER}`);
console.log("Report bugs and fork the project on GitHub: https://github.com/SoftwareGuy/NodeListServer");

expressApp.listen(configuration.Core.listenPort, () => console.log(`NodeLS is now listening on port ${configuration.Core.listenPort}.`));
