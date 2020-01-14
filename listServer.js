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
expressApp.get("/list", apiGetServerList)				// List of servers...
expressApp.post("/add", apiAddToServerList)				// Add a server to the list...
expressApp.post("/remove", apiRemoveFromServerList)		// Remove a server from the list...

// Finally, start the application
console.log("This is Mirror List Server, NodeJS version by SoftwareGuy (Coburn).");
expressApp.listen(listenPort, () => console.log(`Up and listening on HTTP port ${listenPort}!`))

function denyRequest (req, res) {
	console.log(`[WARN] Denied request from ${req.ip}. Method: ${req.method}; Path: ${req.path}`)
	res.sendStatus(400)
	return
}

// --- Functions --- //
function apiGetServerList(req, res) {
	if(req.method != "GET") {
		console.log(`[WARN] Denied request from ${req.ip}; expected GET but got ${req.method} instead!`)		
		return res.sendStatus(400)
	}

	// A client wants the server list.
	// Compile it and send out via JSON.
	var serverList = [];
	
	for (var i = 0, len = knownServers.length; i < len; i++) {
		serverList.push({ 'ip': knownServers[i].ip, 'name': knownServers[i].name, 'port': knownServers[i].port });
	}
	
	// console.log(knownServers);
	// console.log(serverList);
	
	// Temporary holder for the server list we're about to send.
	var returnedServerList = [{
		'count': serverList.length,
		'servers': serverList,
	}]

	// console.log(returnedServerList)
	console.log(`[INFO] Sending server list to ${req.ip}`)
	return res.json(returnedServerList)
}

function apiAddToServerList(req, res) {
	if(req.method != "POST") {
		console.log(`[WARN] Denied request from ${req.ip}; expected POST but got ${req.method} instead!`)
		return res.sendStatus(400)
	}

	// Sanity Checks
	if(req.body === undefined) {
		console.log("[WARN] Add server request had no proper data.");
		return res.sendStatus(400)
	}

	// Top Secret Debugging Leftovers
	// console.log(req.body)
	// curl -X POST --data "serverUuid=ef914272-17e4-11ea-b0b7-fbbcad81d6d3&serverName=Test&serverPort=7777"
	
	if(req.body.serverUuid === undefined || req.body.serverName === undefined || req.body.serverPort === undefined) {
		console.log(`[WARN] Add server request: No server UUID, name and/or port specified from ${req.ip}`);
		return res.sendStatus(400)
	}
	
	// Add the server to the list.
	// NOTE: we check if there's a UUID collision before we add the server, as this will help prevent
	// malicious abuse or instances where the same UUID gets added twice, etc. 
	if(apiDoesThisServerExist(req.body.serverUuid, knownServers)) {
		// Collision - abort!
		console.log(`[WARN] Server UUID collision. Not adding a new entry for '${req.body.serverUuid}' from ${req.ip}`)
		return res.sendStatus(400)
	}

	// We'll get the IP address directly, don't worry about that
	var newServer = { 'uuid': req.body.serverUuid, 'ip': req.ip, 'name': req.body.serverName, 'port': req.body.serverPort }

	knownServers.push(newServer);
	console.log(`[INFO] Added server '${req.body.serverUuid}' to cache from ${req.ip}`)
	return res.send("OK")
}

function apiRemoveFromServerList(req, res) {	
	if(req.method != "POST") {
		console.log(`[WARN] Denied request from ${req.ip}; expected POST but got ${req.method} instead!`)
		return res.sendStatus(400)
	}

	if(req.body === undefined) {
		// POST attack?
		console.log(`[WARN] Denied request from ${req.ip}; no POST data was provided.`)
		return res.sendStatus(400)
	}
	
	if(req.body.serverUuid === undefined) {
		// Server isn't specified?
		console.log(`[WARN] Denied request from ${req.ip}; Server UUID was not provided.`)
		return res.sendStatus(400)
	}
	
	var newKnownServers = knownServers.filter(server => server.uuid != req.body.serverUuid)
	console.log(`[INFO] Deleted server '${req.body.serverUuid}' (if it existed) from cache (requested by ${req.ip})`)
	return res.send("OK");

	// Left over fragment.
	// Fail safe.
	// return res.sendStatus(501)
}

// PR welcome to fix this horrible mess.
// I know how to do this in C# but not in NodeJS.
function apiDoesThisServerExist(uuid, array) {
	var doesExist = knownServers.filter(server => server.uuid == uuid);
	
	if(doesExist.count() > 0) return true;
	
	// Fall though.
	return false;
}
