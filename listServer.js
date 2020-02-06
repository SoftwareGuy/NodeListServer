/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// NodeJS Implementation of Mirror Network List Server
// Developed by Matt Coburn (SoftwareGuy/Coburn64)
// --------------
// This software is licensed under the MIT License
// Copyright (c) 2019 Matt Coburn
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
// --------------
// Editable things
// --------------
// The listening port for this List Server instance.
const listenPort = 8889;
const useAccessControl = false;
// Allowed Server Addresses need to be in IPv6 format, for example IPv4 127.0.0.1 becomes this according
// to the Express Web Server.
const allowedServerAddresses = [ "::ffff:127.0.0.1" ];
// Secure list server Key, offers an increase of protection, send through unity
// change default example, can be any string combination. (In Unity: form.AddField("serverKey", "666"); )
const secureLSKey = "NodeListServerDefaultKey";

// ---------------
// STOP! Do not edit below this line unless you know what you're doing,
// or you are experienced with NodeJS (Javascript) programming. You 
// will most likely break something, and unless you know how to
// fix it yourself, you may be up the creek without a paddle.
// ---------------
// Constant references to various modules.
const expressServer = require("express");
const expressApp = expressServer();
const bodyParser = require("body-parser");

// Let Express use Body Parser. Leave this alone.
// We'll mainly use the JSON version.
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));

// Server memory array cache.
var knownServers = [];

// --- Functions --- //
// - Authentication
// apiCheckKey: Checks to see if the client specified key matches.
function apiCheckKey(clientKey) {
	if(clientKey === secureLSKey) {
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
	console.warn(`Denied request from ${req.ip}. Method: ${req.method}; Path: ${req.path}`);
	return res.sendStatus(400);
}

// apiGetServerList: This handler returns a JSON array of servers to the clients.
function apiGetServerList(req, res) {	
	if(typeof req.body.serverKey === "undefined" || apiCheckKey(req.body.serverKey))
	{
		console.warn(`${req.ip} tried to send request with wrong key: ${req.body.serverKey}`);
		return res.sendStatus(400);
	}
	else
	{
		// Shows if keys match for those getting list server details.
		console.log(`[INFO] Client key from ${req.ip} is correct: '${req.body.serverKey}'`);
	}

	// A client wants the server list. Compile it and send out via JSON.
	var serverList = [];
	
	knownServers.forEach((knownServer) => {
		serverList.push({ 
			"ip": knownServer.ip, 
			"name": knownServer.name, 
			"port": parseInt(knownServer.port, 10), 
			"players": parseInt(knownServer.players, 10)
		});
	});

	// Temporary holder for the server list we're about to send.
	var returnedServerList = {
		"count": serverList.length,
		"servers": serverList,
	};

	// console.log(returnedServerList)
	console.log(`[INFO] Sending server list to ${req.ip}.`);
	return res.json(returnedServerList);
}

// apiAddToServerList: Adds a server to the list.
function apiAddToServerList(req, res) {
	if(typeof req.body.serverKey === "undefined" || apiCheckKey(req.body.serverKey))
	{
		console.warn(`${req.ip} tried to send request with wrong key: ${req.body.serverKey}`);
		return res.sendStatus(400);
	}

	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.warn(`Add Server request blocked from ${req.ip}: Not in ACL.`);
		return res.sendStatus(403);
	}
	
	// Sanity Checks
	if(typeof req.body === "undefined") {
		console.warn("Add Server request had no proper data.");
		return res.sendStatus(400);
	}
	
	if(typeof req.body.serverUuid === "undefined" || typeof req.body.serverName === "undefined" || typeof req.body.serverPort === "undefined") {
		console.warn(`Add server request: No server UUID, name and/or port specified from ${req.ip}`);
		return res.sendStatus(400);
	}
		
	// Add the server to the list.
	
	// Checkpoint 1: UUID Collision check
	// If there's a UUID collision before we add the server then don't add the server to the cache, as this will help prevent
	// malicious abuse or instances where the same UUID gets added twice, etc.
	if(apiDoesServerExist(req.body.serverUuid)) {
		// Collision - abort!
		console.warn(`Server UUID collision. Not adding a new entry for '${req.body.serverUuid}' from ${req.ip}`);
		return res.sendStatus(400);
	}
	
	// Checkpoint 2: IP and Port collision check
	// If there's already a server on this IP or Port then don't add the server to the cache. This will stop duplicates.
	if(apiDoesThisServerExistByAddressPort(req.ip, req.body.serverPort)) {
		// Collision - abort!
		console.warn(`Server IP and Port Collision. Not adding a new entry for '${req.body.serverUuid}' from ${req.ip}`);
		return res.sendStatus(400);
	}
	
	// We'll get the IP address directly, don't worry about that
	var newServer = { 
		"uuid": req.body.serverUuid, 
		"ip": req.ip, 
		"name": req.body.serverName, 
		"port": req.body.serverPort, 
		"players": req.body.serverPlayers
	};

	// Push, but don't shove it onto stack.
	knownServers.push(newServer);
	
	console.log(`[INFO] Added server '${req.body.serverUuid}' to cache from ${req.ip}`);
	return res.send("OK");
}

// apiRemoveFromServerList: Removes a server from the list.
function apiRemoveFromServerList(req, res) {
	if(typeof req.body.serverKey === "undefined" || apiCheckKey(req.body.serverKey))
	{
		console.warn(`${req.ip} tried to send request with wrong key: ${req.body.serverKey}`);
		return res.sendStatus(400);
	}

	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.warn(`Remove server request blocked from ${req.ip}. They are not known in our allowed IPs list.`);
		return res.sendStatus(403);
	}
	
	// Lul, someone tried to send a empty request.
	if(typeof req.body === "undefined") {
		console.warn(`Denied request from ${req.ip}; no POST data was provided.`);
		return res.sendStatus(400);
	}

	// Server isn't specified?	
	if(typeof req.body.serverUuid === "undefined") {
		console.warn(`Denied request from ${req.ip}; Server UUID was not provided.`);
		return res.sendStatus(400);
	}
	
	
	if(!apiDoesServerExist(req.body.serverUuid, knownServers)) {
		console.warn(`Cannot delete server '${req.body.serverUuid}' from cache (requested by ${req.ip}): No such server`);
		return res.sendStatus(400);
	} else {
		knownServers = knownServers.filter((server) => server.uuid !== req.body.serverUuid);
		console.log(`[INFO] Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip})`);
		return res.send("OK");
	}
}

// apiUpdateServerInList: Updates a server in the list.
function apiUpdateServerInList(req, res) {
	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.warn(`Update server request blocked from ${req.ip}. They are not known in our allowed IPs list.`);
		return res.sendStatus(403);
	}
	
	if(typeof req.body.serverKey === "undefined" || apiCheckKey(req.body.serverKey))
	{
		console.warn(`${req.ip} tried to send request with wrong key: ${req.body.serverKey}`);
		return res.sendStatus(400);
	}
	
	// Lul, someone tried to send a empty request.
	if(typeof req.body === "undefined") {
		console.warn(`Denied request from ${req.ip}; no POST data was provided.`);
		return res.sendStatus(400);
	}
	
	// Server isn't specified?	
	if(typeof req.body.serverUuid === "undefined") {
		console.warn(`Denied request from ${req.ip}; Server UUID was not provided.`);
		return res.sendStatus(400);
	}

	// Does the server even exist?
	if(!apiDoesServerExist(req.body.serverUuid)) {
		console.warn(`Cannot update server '${req.body.serverUuid}' (requested by ${req.ip}): No such server`);
		return res.sendStatus(400);
	}
	
	// Okay, all those checks passed, let's do this.
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

	if(typeof req.body.newServerName !== "undefined") {
		updatedServer["name"] = req.body.newServerName.trim();
	} else {
		updatedServer["name"] = serverInQuestion[0].name;
	}

	if(typeof req.body.newPlayerCount !== "undefined") {
		if(isNaN(parseInt(req.body.newPlayerCount, 10))) {
			updatedServer["players"] = 0;
		} else {
			updatedServer["players"] = parseInt(req.body.newPlayerCount, 10);
		}
	} else {
		updatedServer["players"] = serverInQuestion[0].players;
	}

	// Push the server back onto the stack.
	notTheServerInQuestion.push(updatedServer);
	knownServers = notTheServerInQuestion;

	return res.send("OK");
}

// -- Start the application -- //
// Coburn: Moved the actual startup routines here to help boost Codacy's opinion.
// Callbacks to various functions, leave this alone unless you know what you're doing.
expressApp.get("/", denyRequest);
expressApp.post("/list", apiGetServerList);					// List of servers...
expressApp.post("/add", apiAddToServerList);				// Add a server to the list...
expressApp.post("/remove", apiRemoveFromServerList);		// Remove a server from the list...
expressApp.post("/update", apiUpdateServerInList);

// Finally, start the application
console.log("Hello there, I'm NodeListServer aka Mirror List Server, NodeJS version by SoftwareGuy (Coburn)");
console.log("Report bugs and fork me on GitHub: https://github.com/SoftwareGuy/NodeListServer");

expressApp.listen(listenPort, () => console.log(`Up and listening on HTTP port ${listenPort}!`));

