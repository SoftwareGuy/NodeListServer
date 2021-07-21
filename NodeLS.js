/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// NodeLS: Node List Server Generation 3
// Developed by Matt Coburn and project contributors.
// --------------
// This software is licensed under the MIT License.
// Copyright (c) 2019 - 2021 Matt Coburn (SoftwareGuy)
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
// ---------------
// Require some essential libraries and modules.
// ---------------
const log4js = require("log4js");
const fs = require("fs");

// ---------------
// Used to store our configuration file data.
// ---------------
var configuration;
var configFile = "config.json";

// ---------------
// Logging configuration. Feel free to modify.
// ---------------
log4js.configure({
  appenders: {
  	'console': { type: 'stdout' },
    	default: { type: 'file', filename: 'NodeListServer.log', maxLogSize: 1048576, backups: 3, compress: true }
  },
  categories: {
    default: { appenders: ['default', 'console'], level: 'debug' }
  }
});

var loggerInstance = log4js.getLogger('NodeListServer');

// ---------------
// Determine if we've got a configuration file path
// supplied by the user at the console...
// ---------------
var arguments = process.argv.slice(2);

if(arguments.length > 0 && fs.existsSync(arguments[0])) {
	loggerInstance.info(`Custom configuration file to load: ${arguments[0]}`);
	configFile = arguments[0];
} else {
	loggerInstance.warn("Custom configuration file is missing, using default path.");	
}

// Do we have a configuration file?
if (fs.existsSync(configFile)) {
	// Read the configuration file.
	fs.readFileSync(configFile, 'utf8', (err, data) => {

		if (err) {
			loggerInstance.error(`Configuration file problem. Failed reading file from disk: ${err}`);
			// Abort.
			process.exit(1);
		} else {
			loggerInstance.info("Stubbed load configuration file");
			process.exit(0);

			// parse JSON string to JSON object
			// configuration = JSON.parse(data);
		}
	});
} else {
	loggerInstance.error("NodeListServer failed to start due to a missing configuration file.");
	loggerInstance.error("Please ensure 'config.json' exists in the directory next to the script file.");
	loggerInstance.error("If you see this message repeatedly, ask for help at https://github.com/SoftwareGuy/NodeListServer.");
	loggerInstance.error("Exiting...");
	process.exit(1);
}

// This function was coded on a whim and probably is jank. Improvements welcome,
// especially how to cast a string into a boolean. ie. "true" -> true.
// In C# I would do bool.TryParse or some other cast.
function translateConfigOptionToBool(value) {
	if(value === "true" || value === 1) {
		return true;
	} else {
		return false;
	}
}

// Constant references to various modules.
const expressServer = require("express");
const expressRateLimiter = require("express-rate-limit");
const expressApp = expressServer();
const bodyParser = require("body-parser");

// Setup the rate limiter...
const limiter = expressRateLimiter({
  windowMs: configuration.Security.rateLimiterWindowMs, 	
  max: configuration.Security.rateLimiterMaxApiRequestsPerWindow
});

expressApp.use(limiter);
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));

// Server memory array cache.
var knownServers = [];

var allowedServerAddresses = [];
if(translateConfigOptionToBool(configuration.Auth.useAccessControl)) {
	allowedServerAddresses = configuration.Auth.allowedIpAddresses.split(",");
}

// - Authentication
// apiCheckKey: Checks to see if the client specified key matches.
function apiCheckKey(clientKey) {
	if(clientKey === configuration.Auth.communicationKey) {
		return true;
	} else {
		return false;
	}
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
// apiDoesServerExist: Checks if the server exists in our cache, by UUID.
function apiDoesServerExist(uuid) {
	var doesExist = knownServers.filter((server) => server.uuid === uuid);
	if(doesExist.length > 0) {
		return true;
	}
	
	// Fall though.
	return false;
}

// apiDoesThisServerExistByAddressPort: Checks if the server exists in our cache, by IP address and port.
function apiDoesThisServerExistByAddressPort(ipAddress, port) {
	var doesExist = knownServers.filter((servers) => (servers.ip === ipAddress && servers.port === port));
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
	// Generation 3 change: don't require a communication key for clients querying the list.
	/* if(apiIsKeyFromRequestIsBad(req))
	{
		return res.sendStatus(400);
	}
	else
	{
		// Shows if keys match for those getting list server details.
		loggerInstance.info(`${req.ip} accepted; communication key matched: '${req.body.serverKey}'`);
	}
	*/
	
	// A client wants the server list. Compile it and send out via JSON.
	var serverList = [];

	// Clean out the old ones.
	knownServers = knownServers.filter((freshServer) => (freshServer.lastUpdated >= Date.now()));

	// Run a loop though the list.
	knownServers.forEach((knownServer) => {
		// If we're hiding servers from the same IP, filter them out.
		if(translateConfigOptionToBool(configuration.Pruning.dontShowServersOnSameIp)) {
			if(knownServer.ip === req.ip) {
				loggerInstance.info(`Server '${knownServer.uuid}' looks like it's hosted on the same IP as this client, skipping.`);
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

	loggerInstance.info(`Sent known servers to client '${req.ip}'.`);
	return res.json(returnedServerList);
}

// apiUpdateServerInList: Updates a server in the list.
function apiUpdateServerInList(req, res) {

	// TODO: Improve this. This feels ugly hack tier and I feel it could be more elegant.
	// If anyone has a PR to improves this, please send me a PR.
	var serverInQuestion = knownServers.filter((server) => (server.uuid === req.body.serverUuid));
	var notTheServerInQuestion = knownServers.filter((server) => (server.uuid !== req.body.serverUuid));

	// I hate it when we get arrays back from that filter function...
	// Pretty sure this could be improved. PR welcome.
	var updatedServer = [];
	updatedServer["uuid"] = serverInQuestion[0].uuid;
	updatedServer["ip"] = serverInQuestion[0].ip;
	
	updatedServer["port"] = serverInQuestion[0].port;
	updatedServer["capacity"] = serverInQuestion[0].capacity;

	if(typeof req.body.serverExtras !== "undefined") {
		updatedServer["extras"] = req.body.serverExtras.trim();
	} else {
		updatedServer["extras"] = serverInQuestion[0].extras;
	}

	if(typeof req.body.serverName !== "undefined") {
		updatedServer["name"] = req.body.serverName.trim();
	} else {
		updatedServer["name"] = serverInQuestion[0].name;
	}

	if(typeof req.body.serverPlayers !== "undefined") {
		if(isNaN(parseInt(req.body.serverPlayers, 10))) {
			updatedServer["players"] = 0;
		} else {
			updatedServer["players"] = parseInt(req.body.serverPlayers, 10);
		}
	} else {
		updatedServer["players"] = serverInQuestion[0].players;
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
	return res.send("OK\n");
}

// apiAddToServerList: Adds a server to the list.
function apiAddToServerList(req, res) {
	// Doorstopper.
	if(apiIsKeyFromRequestIsBad(req))
	{
		return res.sendStatus(400);
	}

	// Are we using access control? If so, are they allowed to do this?
	if(translateConfigOptionToBool(configuration.Auth.useAccessControl) && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		loggerInstance.warn(`Denied add request from ${req.ip}: Not in ACL.`);
		return res.sendStatus(403);
	}

	// Sanity Checks
	if(typeof req.body === "undefined") {
		loggerInstance.warn(`Denied add request from ${req.ip}: Missing request POST body.`);
		return res.sendStatus(400);
	}
	
	if(typeof req.body.serverUuid === "undefined" || typeof req.body.serverName === "undefined" || typeof req.body.serverPort === "undefined") {
		loggerInstance.warn(`Denied add request from ${req.ip}: UUID, name and/or port is sus or bogus.`);
		return res.sendStatus(400);
	}

	if(isNaN(req.body.serverPort) || req.body.serverPort < 0 || req.body.serverPort > 65535) {
		loggerInstance.warn(`Denied add request from ${req.ip}: Port out of bounds.`);
		return res.sendStatus(400);
	}
	
	// Add the server to the list.
	
	/// Checkpoint 1: UUID Collision check
	// If there's a UUID collision before we add the server then update the matching server.
	if(apiDoesServerExist(req.body.serverUuid))
	{
		// Collision - update!
		loggerInstance.info(`Server already known to us; updating server UUID '${req.body.serverUuid}'...'`);
		apiUpdateServerInList(req, res);
	}
	else
	{
		// Checkpoint 2: IP and Port collision check
		// If there's already a server on this IP or Port then don't add the server to the cache. This will stop duplicates.
		if(apiDoesThisServerExistByAddressPort(req.ip, req.body.serverPort)) {
			// Collision - abort!
			loggerInstance.warn(`Denied add request from ${req.ip}: Server IP/Port collision.`);
			return res.sendStatus(400);
		}

		// We'll get the IP address directly, don't worry about that
		var newServer = { 
			"uuid": req.body.serverUuid, 
			"ip": req.ip, 
			"name": req.body.serverName, 
			"port": parseInt(req.body.serverPort, 10),
			"lastUpdated": (Date.now() + (configuration.Pruning.inactiveServerRemovalMinutes * 60 * 1000))
		};

		// Extra field santitization
		if(typeof req.body.serverPlayers === "undefined" || isNaN(req.body.serverPlayers)) {
			newServer["players"] = 0;
		} else {
			newServer["players"] = parseInt(req.body.serverPlayers, 10);
		}

		if(typeof req.body.serverCapacity === "undefined" || isNaN(req.body.serverCapacity)) {
			newServer["capacity"] = 0;
		} else {
			newServer["capacity"] = parseInt(req.body.serverCapacity, 10);
		}

		if(typeof req.body.serverExtras !== "undefined") {
			newServer["extras"] = req.body.serverExtras;
		} else {
			newServer["extras"] = "";
		}

		knownServers.push(newServer);

		loggerInstance.info(`Added server '${req.body.serverUuid}' ('${req.body.serverName}') from ${req.ip} to cache.`);
		return res.send("OK\n");
	}
}

// apiRemoveFromServerList: Removes a server from the list.
function apiRemoveFromServerList(req, res) {
	// Doorstopper.
	if(apiIsKeyFromRequestIsBad(req))
	{
		return res.sendStatus(400);
	}

	// Are we using access control? If so, are they allowed to do this?
	if(translateConfigOptionToBool(configuration.Auth.useAccessControl) && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		loggerInstance.warn(`Denied delete request from ${req.ip}: IP address not allowed.`);
		return res.sendStatus(403);
	}

	if(typeof req.body === "undefined") {
		loggerInstance.warn(`Denied delete request from ${req.ip}: Missing POST data.`);
		return res.sendStatus(400);
	}

	// Server isn't specified?	
	if(typeof req.body.serverUuid === "undefined") {
		loggerInstance.warn(`Denied delete request from ${req.ip}: Server UUID missing.`);
		return res.sendStatus(400);
	}
	
	if(!apiDoesServerExist(req.body.serverUuid, knownServers)) {
		loggerInstance.warn(`Denied delete request from ${req.ip}: No such server known - ${req.body.serverUuid}`);
		return res.sendStatus(400);
	} else {
		knownServers = knownServers.filter((server) => server.uuid !== req.body.serverUuid);
		loggerInstance.info(`Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip}).`);
		return res.send("OK\n");
	}
}

// -- Start the application -- //
// Coburn: Moved the actual startup routines here to help boost Codacy's opinion.
// Callbacks to various functions, leave this alone unless you know what you're doing.
expressApp.get("/", apiGetServerList);
expressApp.get("/list", apiGetServerList);
expressApp.post("/add", apiAddToServerList);
expressApp.post("/remove", apiRemoveFromServerList);

// Finally, start the application
console.log("NodeLS: Node List Server Generation 3 (Development Version)");
console.log("Report bugs, fork the project and support the developer on GitHub at https://github.com/SoftwareGuy/NodeListServer");

expressApp.listen(configuration.Core.listenPort, () => console.log(`NodeLS started listening on ${configuration.Core.listenPort}.`));
