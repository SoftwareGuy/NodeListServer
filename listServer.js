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
const listenPort = 8889
const useAccessControl = false

// Allowed Server Addresses need to be in IPv6 format, for example IPv4 127.0.0.1 becomes this according
// to the Express Web Server.
const allowedServerAddresses = [ "::ffff:127.0.0.1" ]

// Secure list server Key, offers an increase of protection, send through unity
// change default example, can be any string combination. (In Unity: form.AddField("serverKey", "666"); )
const secureLSKey = "666"

// ---------------
// STOP! Do not edit below this line unless you know what you're doing,
// or you are experienced with NodeJS (Javascript) programming. You 
// will most likely break something, and unless you know how to
// fix it yourself, you may be up the creek without a paddle.
// ---------------

// Constant references to various modules.
const expressServer = require('express')
const expressApp = expressServer()
const bodyParser = require('body-parser')

// Let Express use Body Parser. Leave this alone.
// We'll mainly use the JSON version.
expressApp.use(bodyParser.json())
expressApp.use(bodyParser.urlencoded({ extended: true }))

// Server memory array cache.
var knownServers = []

// Callbacks to various functions, leave this alone unless you know what you're doing.
expressApp.get("/", denyRequest)
expressApp.post("/list", apiGetServerList)				// List of servers...
expressApp.post("/add", apiAddToServerList)				// Add a server to the list...
expressApp.post("/remove", apiRemoveFromServerList)		// Remove a server from the list...
expressApp.post("/update", apiUpdateServerInList)

// Finally, start the application
console.log("Hello there, I'm NodeListServer aka Mirror List Server, NodeJS version by SoftwareGuy (Coburn)")
console.log("Report bugs and fork me on GitHub: https://github.com/SoftwareGuy/NodeListServer")

expressApp.listen(listenPort, () => console.log(`Up and listening on HTTP port ${listenPort}!`))

function denyRequest (req, res) {
	console.log(`[WARN] Denied request from ${req.ip}. Method: ${req.method}; Path: ${req.path}`)
	res.sendStatus(400)
	return
}

// --- Functions --- //
// API: Returns JSON list of servers.
function apiGetServerList(req, res) {
	if(req.method != "POST") {
		console.log(`[WARN] Denied request from ${req.ip}; expected GET but got ${req.method} instead!`)		
		return res.sendStatus(400)
	}
	
	if(req.body.serverKey === undefined || req.body.serverKey != secureLSKey)
	{
		console.log(`[WARN] Keys do not match ${req.body.serverKey} ${secureLSKey}`);
		return res.sendStatus(400)
	}
	else
	{
		//Shows if keys match for those getting list server details.
		console.log(`[WARN] Keys match ${req.body.serverKey} ${secureLSKey}`);
	}

	// A client wants the server list. Compile it and send out via JSON.
	var serverList = [];
	
	for (var i = 0, len = knownServers.length; i < len; i++) {
		serverList.push({ 'ip': knownServers[i].ip, 'name': knownServers[i].name, 'port': parseInt(knownServers[i].port), 'players': parseInt(knownServers[i].players)})
	}

	// Temporary holder for the server list we're about to send.
	var returnedServerList = {
		'count': serverList.length,
		'servers': serverList,
	}

	// console.log(returnedServerList)
	console.log(`[INFO] Sending server list to ${req.ip}.`)
	return res.json(returnedServerList)
}

// API: Add a server to the list.
function apiAddToServerList(req, res) {
	if(req.method != "POST") {
		console.log(`[WARN] Denied request from ${req.ip}; expected POST but got ${req.method} instead!`)
		return res.sendStatus(400)
	}
	
	if(req.body.serverKey === undefined || req.body.serverKey != secureLSKey)
	{
		console.log(`[WARN] Keys do not match ${req.body.serverKey} ${secureLSKey}`);
		return res.sendStatus(400)
	}

	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.log(`[WARN] Add server request blocked from ${req.ip}. They are not known in our allowed IPs list.`);
		return res.sendStatus(403)
	}
	
	// Sanity Checks
	if(req.body === undefined) {
		console.log("[WARN] Add server request had no proper data.");
		return res.sendStatus(400)
	}
	
	if(req.body.serverUuid === undefined || req.body.serverName === undefined || req.body.serverPort === undefined) {
		console.log(`[WARN] Add server request: No server UUID, name and/or port specified from ${req.ip}`);
		return res.sendStatus(400)
	}
		
	// Add the server to the list.
	
	// Checkpoint 1: UUID Collision check
	// If there's a UUID collision before we add the server then don't add the server to the cache, as this will help prevent
	// malicious abuse or instances where the same UUID gets added twice, etc.
	if(apiDoesServerExist(req.body.serverUuid)) {
		// Collision - abort!
		console.log(`[WARN] Server UUID collision. Not adding a new entry for '${req.body.serverUuid}' from ${req.ip}`)
		return res.sendStatus(400)
	}
	
	// Checkpoint 2: IP and Port collision check
	// If there's already a server on this IP or Port then don't add the server to the cache. This will stop duplicates.
	if(apiDoesThisServerExistByAddressPort(req.ip, req.body.serverPort)) {
		// Collision - abort!
		console.log(`[WARN] Server IP and Port Collision. Not adding a new entry for '${req.body.serverUuid}' from ${req.ip}`)
		return res.sendStatus(400)
	}
	
	// We'll get the IP address directly, don't worry about that
	var newServer = { 'uuid': req.body.serverUuid, 'ip': req.ip, 'name': req.body.serverName, 'port': req.body.serverPort, 'players': req.body.serverPlayers }

	// Get to the bus, before we're outta time.
	knownServers.push(newServer);
	
	console.log(`[INFO] Added server '${req.body.serverUuid}' to cache from ${req.ip}`)
	return res.send("OK")
}

// API: Remove a server from the list.
function apiRemoveFromServerList(req, res) {
	// GET outta here.
	if(req.method != "POST") {
		console.log(`[WARN] Denied request from ${req.ip}; expected POST but got ${req.method} instead!`)
		return res.sendStatus(400)
	}
	
	if(req.body.serverKey === undefined || req.body.serverKey != secureLSKey)
	{
		console.log(`[WARN] Keys do not match ${req.body.serverKey} ${secureLSKey}`);
		return res.sendStatus(400)
	}

	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.log(`[WARN] Remove server request blocked from ${req.ip}. They are not known in our allowed IPs list.`);
		return res.sendStatus(403);
	}
	
	// Lul, someone tried to send a empty request.
	if(req.body === undefined) {
		console.log(`[WARN] Denied request from ${req.ip}; no POST data was provided.`)
		return res.sendStatus(400)
	}

	// Server isn't specified?	
	if(req.body.serverUuid === undefined) {
		console.log(`[WARN] Denied request from ${req.ip}; Server UUID was not provided.`)
		return res.sendStatus(400)
	}
	
	
	if(!apiDoesServerExist(req.body.serverUuid, knownServers)) {
		console.log(`[WARN] Cannot delete server '${req.body.serverUuid}' from cache (requested by ${req.ip}): No such server`)
		return res.sendStatus(400)
	} else {
		knownServers = knownServers.filter(server => server.uuid != req.body.serverUuid)
		console.log(`[INFO] Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip})`)
		return res.send("OK")
	}
	
	// Fail safe.
	return res.sendStatus(501)
}

// API: Update a server in the list.
function apiUpdateServerInList(req, res) {
	// Are we using access control? If so, are they allowed to do this?
	if(useAccessControl === true && !allowedServerAddresses.includes(req.ip)) {
		// Not allowed.
		console.log(`[WARN] Update server request blocked from ${req.ip}. They are not known in our allowed IPs list.`)
		return res.sendStatus(403)
	}
	
	if(req.body.serverKey === undefined || req.body.serverKey != secureLSKey)
	{
		console.log(`[WARN] Keys do not match ${req.body.serverKey} ${secureLSKey}`);
		return res.sendStatus(400)
	}
	
	// Lul, someone tried to send a empty request.
	if(req.body === undefined) {
		console.log(`[WARN] Denied request from ${req.ip}; no POST data was provided.`)
		return res.sendStatus(400)
	}
	
	// Server isn't specified?	
	if(req.body.serverUuid === undefined) {
		console.log(`[WARN] Denied request from ${req.ip}; Server UUID was not provided.`)
		return res.sendStatus(400)
	}

	// Does the server even exist?
	if(!apiDoesServerExist(req.body.serverUuid)) {
		console.log(`[WARN] Cannot update server '${req.body.serverUuid}' (requested by ${req.ip}): No such server`)
		return res.sendStatus(400)
	}
	
	// Okay, all those checks passed, let's do this.
	// TODO: Improve this. This feels ugly hack tier and I feel it could be more elegant.
	// If anyone has a PR to improves this, please send me a PR.
	var serverInQuestion = knownServers.filter(server => (server.uuid == req.body.serverUuid));
	var notTheServerInQuestion = knownServers.filter(server => (server.uuid != req.body.serverUuid));

	// Debugging
	// console.log(serverInQuestion)
	// console.log(notTheServerInQuestion)

	// I hate it when we get arrays back from that filter function...
	// Pretty sure this could be improved. PR welcome.
	var updatedServer = []
	updatedServer['uuid'] = serverInQuestion[0].uuid
	updatedServer['port'] = serverInQuestion[0].port
	updatedServer['ip'] = serverInQuestion[0].ip

	if(req.body.newServerName !== undefined) {
		updatedServer['name'] = req.body.newServerName.trim()
	} else {
		updatedServer['name'] = serverInQuestion[0].name
	}

	if(req.body.newPlayerCount !== undefined) {
		if(parseInt(req.body.newPlayerCount) == NaN) {
			updatedServer['players'] = 0
		} else {
			updatedServer['players'] = parseInt(req.body.newPlayerCount)
		}
	} else {
		updatedServer['players'] = serverInQuestion[0].players
	}

	// Debugging
	// console.log(updatedServer)

	// Push the server back onto the stack.
	notTheServerInQuestion.push(updatedServer)
	knownServers = notTheServerInQuestion

	return res.send("OK")
}

// Checks if the server exists in our cache, by UUID.
function apiDoesServerExist(uuid) {
	var doesExist = knownServers.filter(server => server.uuid == uuid);
	if(doesExist.length > 0) return true;
	
	// Fall though.
	return false;
}

// Checks if the server exists in our cache, by IP address and port.
function apiDoesThisServerExistByAddressPort(ipAddress, port) {
	var doesExist = knownServers.filter(servers => (servers.ip == ipAddress && servers.port == port));
	if(doesExist.length > 0) return true;
	
	// Fall though.
	return false;
}
