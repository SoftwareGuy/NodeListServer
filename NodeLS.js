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
var configFile = "./config.json";
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

// ---------------
// Determine if we've got a configuration file path
// supplied by the user at the console...
// ---------------
var arguments = process.argv.slice(2);

if(arguments.length > 0 && fs.existsSync(arguments[0])) {
	loggerInstance.info(`Custom configuration file to load: ${arguments[0]}`);
	configFile = arguments[0];
}

// Do we have a configuration file?
if (fs.existsSync(configFile)) {
	// Read the configuration file.
	loggerInstance.info("Reading configuration file...");
	
	try {
		const configFileSource = fs.readFileSync(configFile, 'utf8');
		configuration = JSON.parse(configFileSource);
	} catch(err) {
		loggerInstance.error(`Error reading configuration file from disk: ${err}`);
		process.exit(1);
	}
} else {
	loggerInstance.error("NodeListServer failed to start due to a missing configuration file.");
	loggerInstance.error("Please ensure 'config.json' exists in the directory next to the script file.");
	loggerInstance.error("If you see this message repeatedly, ask for help at https://github.com/SoftwareGuy/NodeListServer.");
	loggerInstance.error("Exiting...");
	process.exit(1);
}

// Check if the configuration file is Generation 3. Otherwise, we bomb out.
if(configuration.NLSConfigVersion != 3) {
	loggerInstance.error("Wrong config file version. You probably need to update your configuration file.");
	loggerInstance.error("Please see https://github.com/SoftwareGuy/NodeListServer for more information.");
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
const expressApp = expressServer();
const bodyParser = require("body-parser");

if(configuration.Security.rateLimiter) {
	loggerInstance.info("Rate limiting enabled. Configuring...");
	const expressRateLimiter = require("express-rate-limit");
	
	const limiter = expressRateLimiter({
	  windowMs: configuration.Security.rateLimiterWindow * 60 * 1000, 	
	  max: configuration.Security.rateLimiterMaxRequests
	});

	expressApp.use(limiter);
}

expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));

// Server array cache.
var knownServers = [];

// - Authentication
// CheckAuthKey: Checks to see if the client specified key matches.
function CheckAuthKey(clientKey) {
	if(clientKey === configuration.Security.communicationKey) {
		return true;
	} else {
		return false;
	}
}

// CheckAuthKeyFromRequestIsBad: The name is a mouthful, but checks if the key is bad.
function CheckAuthKeyFromRequestIsBad(req) {
	if(typeof req.body.serverKey === "undefined" || !CheckAuthKey(req.body.serverKey))
	{
		loggerInstance.warn(`Auth Key mismatch from ${req.ip}, failed key was ${req.body.serverKey}`);
		return true;
	} else {
		return false;
	}
}

// - Sanity Checking
// CheckDoesServerAlreadyExist: Checks if the server exists in our cache, by UUID.
function CheckDoesServerAlreadyExist(uuid) {
	var doesExist = knownServers.filter((server) => server.uuid === uuid);
	if(doesExist.length > 0) {
		return true;
	}
	
	// Fall though.
	return false;
}

// CheckExistingServerCollision: Checks if the server exists in our cache, by IP address and port.
function CheckExistingServerCollision(ipAddress, port) {
	var doesExist = knownServers.filter((servers) => (servers.ip === ipAddress && servers.port === port));
	if(doesExist.length > 0) {
		return true;
	}

	// Fall though.
	return false;
}

// -- Request Handling
// DenyRequest: Generic function that denies requests.
function DenyRequest (req, res) {
	// Shush this up.
	// loggerInstance.warn(`Request from ${req.ip} denied. Tried ${req.method} method on path: ${req.path}`);
	return res.sendStatus(400);
}

// GetServerList: This handler returns a JSON array of servers to the clients.
function GetServerList(req, res) {
	// A client wants the server list. Compile it and send out via JSON.
	var serverList = [];

	// Clean out the old ones.	
	knownServers = knownServers.filter((freshServer) => (freshServer.lastUpdated >= Date.now()));	
	
	// Make a copy so we can do filtering.
	tempServers = knownServers;
	
	// If we've got the gameId query string, then we need to also do some magic.
	if(req.query.gameId !== undefined) {
		tempServers = tempServers.filter((tempServer) => (tempServer.gameId == req.query.gameId.trim()));
	} else {
		tempServers = tempServers.filter((tempServer) => (tempServer.gameId == ""));
	}
		
	
	// Run a loop though the list.
	tempServers.forEach((knownServer) => {
		// If we're hiding servers from the same IP, filter them out.
		if(configuration.Clients.dontShowSameIp) {
			if(knownServer.ip === req.ip) {
				loggerInstance.info(`Server '${knownServer.name}' looks like it's hosted on the same IP as this client, skipping.`);
				return;
			}
		}

		serverList.push(knownServer);
	});

	// Temporary holder for the server list we're about to send.
	var returnedServerList = {
		"count": serverList.length,
		"servers": serverList,
		"updateFrequency": configuration.Clients.updateFrequency
	};
	
	if(req.query.gameId !== undefined)
		loggerInstance.info(`Replied to '${req.ip}' with known servers for game id '${req.query.gameId.trim()}'.`);
	else
		loggerInstance.info(`Replied to '${req.ip}' with known servers.`);
	
	return res.json(returnedServerList);
}

// UpdateServerInList: Updates a server in the list.
function UpdateServerInList(req, res) {

	// TODO: Improve this. This feels ugly hack tier and I feel it could be more elegant.
	// If anyone has a PR to improves this, please send me a PR.
	var serverInQuestion = knownServers.filter((server) => (server.uuid === req.body.serverUuid.trim()));
	var otherServers = knownServers.filter((server) => (server.uuid !== req.body.serverUuid));

	// Holy shit I totally am not doing inline if statements back to back
	// What the heck am I doing, it's a back to back if-spin double!
	
	// Do not update the UUID. That cannot be changed.
	serverInQuestion[0].name = (typeof req.body.serverExtras !== "undefined") ? req.body.serverName.trim() : serverInQuestion[0].name;
	
	// Only allow important server information changing if configuration allows it.	
	if(configuration.Security.allowChangingImportantServerDetails) {		
		// A server shouldn't change it's game id, but well, in case someone wants that functionality...
		serverInQuestion[0].gameId = (typeof req.body.serverGameId !== "undefined") ? req.body.serverGameId.trim() : "";
		
		// IP Address change.
		serverInQuestion[0].ip = ((typeof req.body.serverIp !== "undefined") ? req.body.serverIp.trim() : serverInQuestion[0].ip);
		
		// Port requires some sanity checks.
		var newPort = req.body.serverPort;
		serverInQuestion[0].port = (typeof newPort !== "undefined" && !isNaN(newPort) && newPort < 0 && newPort > 65535) ? newPort : serverInQuestion[0].port;
	}
	
	serverInQuestion[0].data = (req.body.serverData !== "undefined") ? req.body.serverData.trim() : serverInQuestion[0].data;
	serverInQuestion[0].lastUpdated = Date.now() + (configuration.Pruning.inactiveServerTimeout * 60 * 1000);
	
	// Push the server back onto the stack.
	otherServers.push(serverInQuestion);

	loggerInstance.info(`Updated server '${serverInQuestion[0].uuid}' ('${serverInQuestion[0].name}') which was requested by ${req.ip}.`);
	return res.sendStatus(200);
}

// AddToServerList: Adds a server to the list.
function AddToServerList(req, res) {
	// Doorstopper.
	if(CheckAuthKeyFromRequestIsBad(req))
		return res.sendStatus(400);

	// Are we using access control? If so, are they allowed to do this?
	if(configuration.Security.accessControlEnabled && !configuration.Security.allowedAddresses.includes(req.ip)) {
		// Not allowed.
		loggerInstance.warn(`Access Control: Denied ${req.ip}. Not allowed.`);
		return res.sendStatus(403);
	}

	// Sanity Checks
	// Checks if POST Body is undefined (null)
	if(typeof req.body === "undefined") {
		loggerInstance.warn(`Denied add request from ${req.ip}. Missing request data.`);
		return res.sendStatus(400);
	}
	
	// Check if the UUID is null (must have one)
	if(typeof req.body.serverUuid === "undefined") {
		loggerInstance.warn(`Denied add request from ${req.ip}. Server UUID was not specified.`);		
		return res.sendStatus(400);
	}
	
	// Check if our port is null, not a number or out of range
	if(typeof req.body.serverPort === "undefined" || isNaN(req.body.serverPort) || req.body.serverPort < 0 || req.body.serverPort > 65535) {
		loggerInstance.warn(`Denied add request from ${req.ip}. Port is null or out of bounds.`);
		return res.sendStatus(400);
	}
	
	// If there's a UUID collision before we add the server then update the matching server.
	if(CheckDoesServerAlreadyExist(req.body.serverUuid))
	{
		// Collision - update!
		loggerInstance.info(`Server already known to us; updating server UUID '${req.body.serverUuid}'.`);
		UpdateServerInList(req, res);
		return;
	}

	if(CheckExistingServerCollision(req.ip, req.body.serverPort)) {
		// Collision - abort!
		loggerInstance.warn(`Denied add request from ${req.ip}. Server IP/Port collision.`);
		return res.sendStatus(400);
	}
	
	var newServer = { 
		"uuid": req.body.serverUuid.trim(),
		"gameId": (typeof req.body.serverGameId !== "undefined") ? req.body.serverGameId.trim() : "",
		"name": (typeof req.body.serverName !== "undefined") ? req.body.serverName.trim() : "Untitled Server",
		"ip": req.ip, 
		"port": parseInt(req.body.serverPort, 10),
		"data": (typeof req.body.serverData !== "undefined") ? req.body.serverData.trim() : "",
		"lastUpdated": (Date.now() + (configuration.Pruning.inactiveServerTimeout * 60 * 1000))
	};

	// Add the server to the list.
	knownServers.push(newServer);

	loggerInstance.info(`Registered server '${newServer.uuid}' ('${newServer.name}') from ${req.ip} in cache.`);
	return res.sendStatus(200);	
}

// RemoveServerFromList: Removes a server from the list.
function RemoveServerFromList(req, res) {
	// Doorstopper.
	if(CheckAuthKeyFromRequestIsBad(req))
		return res.sendStatus(400);

	// Are we using access control? If so, are they allowed to do this?
	if(configuration.Security.accessControlEnabled && !configuration.Security.allowedAddresses.includes(req.ip)) {
		// Not allowed.
		loggerInstance.warn(`Access Control: Denied ${req.ip}. Not allowed.`);
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
	
	if(!CheckDoesServerAlreadyExist(req.body.serverUuid, knownServers)) {
		loggerInstance.warn(`Denied delete request from ${req.ip}: No such server known - ${req.body.serverUuid}`);
		return res.sendStatus(400);
	} else {
		knownServers = knownServers.filter((server) => server.uuid !== req.body.serverUuid);
		loggerInstance.info(`Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip}).`);
		return res.sendStatus(200);
	}
}

// Define routes to various functions, leave this alone unless you know what you're doing.
expressApp.get("/", GetServerList);
expressApp.get("/list", GetServerList);
expressApp.post("/add", AddToServerList);
expressApp.post("/delete", RemoveServerFromList);

// Finally, start the application
console.log("NodeLS: Node List Server Generation 3 (Development Version)");
console.log("Report bugs, fork the project and support the developer on GitHub at https://github.com/SoftwareGuy/NodeListServer");

expressApp.listen(configuration.Core.listenPort,
 () => console.log(`NodeLS listening on ${configuration.Core.listenPort}.`));

/*
 * Scratchpad - to be removed
	"uuid": "",
	"name": "",
	"ipAddress": "",
	"port": 0,
	"gameId": "",
	"data": ""
*/