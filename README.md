# NodeListServer
[![Ko-Fi](https://img.shields.io/badge/Donate-Ko--Fi-red)](https://ko-fi.com/coburn) 
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue)](https://paypal.me/coburn64)
![MIT Licensed](https://img.shields.io/badge/license-MIT-green.svg)

This is a reimplementation of the Mirror List Server using NodeJS with 100% Fresh, Organic, Free-Range Australian Code. It runs on top of NodeJS 12.x LTS with Express as the light-weight web server.

_Note: I highly recommend running NodeListServer on a Linux server instance rather than Windows. If you are running NodeJS on Windows, please do your best to adapt various instructions to the Windows equivalents._

## Features

- **Open Source:** Mirror's own List Server is closed source. This is open source where you can look at my code and suggest improvements, fix bugs, etc.
- **Fast:** NodeJS is quick and nimble, and so is this List Server.
- **Unity WebGL support:** Since we're using HTTP calls, Unity WebGL games can use it this too. *Mirror's own List Server uses TCP, which makes it incompatible with WebGL games.*
- NodeListServer is not just limited to games, you could use it for other non-Unity applications too!

## Non-Features

NodeListServer does not have the following features:

- **Matchmaking:** Too complicated for what this product does.
- **IP Address Blacklisting/Whitelisting:** Add it yourself if you want it.
- Anything else that it doesn't offer.

## Bug Fixes, New Features, etc

- **If you find a bug:** Please report it via the Issues ticket system. If you know NodeJS-flavoured Javascript and ***think that you can fix it*** then I'd really appreciate a pull request!
- **If you find something in the code that doesn't make sense or can be improved:** I'm all ears to improvements and refinements. Please open a issue and suggest your modifications or fork this project, improve it, then open a PR.
- **If you want a new feature:** New features are carefully considered. I try to follow the KISS prinicible, which helps not only keep code clean but doesn't bloat the end product. Please don't feel offended if I reject an idea, by all means you can make your own variant of NodeListServer with your own additions.

## Setup

### Requirements

1. NodeJS 12.x LTS (**download and install it first before trying to run this code**)
2. A server instance, be it Windows or Linux
3. Some knowledge about programming, fair amount of patience and Git-fu

**Make sure your installation of NodeJS 12.x LTS is functional before continuing!**

## Installation

### Git Clone Method (recommended)

1. Clone this repository via the clone URL provided. On Windows and Mac you can use Git GUI or SourceTree. On Mac/Linux, just make sure you have git installed, then use the Terminal to get that freshly baked source code.
2. Follow the instructions outlined in the **Operating & Updating** header below.

### ZIP Installation Method

1. Obtain a ZIP archive of this repository via the "Download as ZIP" option.
2. Extract it somewhere on your system.

**Note: The ZIP Installation Method loses it's Git metadata, so you will not be able to have easy updates.**

## Configuration

1. Open `listServer.js` in your text editor.
2. Find this comment block:

```javascript
// --------------
// Editable things
// --------------
```

3. Edit any variables under this comment block. **Do not edit anything below where it says "STOP!".**
4. Save and Exit the Text Editor. Re-upload your modified listServer.js file if required (ie. you edited it via FTP).

## Operating & Updating

### Starting and Stopping

_Note: It's recommended to use a process manager like **PM2** which will allow you start and stop the server elegantly, and restart it in case of crashes, etc._

**First Run:**
1. Install the Node modules by issuing `npm install`. This will read the requirements from packages.json.

**To start the server:**
1. Invoke NodeJS with `listServer.js`. This is dependent on your operating system, but if Node is installed in your path, you can simply do `node listServer.js`. Ensure you use the Node 12.x binary.
2. Observe the logs. If the list server does not say anything then something went wrong. Check to see if the port is open that you want NodeListServer to listen on. **You cannot have more than one list server listening on the same port number.**
3. Try poking the server via `http://[your server ip]:8889` or whatever port you configured it as. If you're running it locally you can do `http://127.0.0.1:8889` with the shipped configuration.
4. If you get a `400 Bad Request` from the address in step 3, that is normal - the server is functional. Nice job!

_Example of a sucessful startup of NodeListServer:_

```
coburn@yamato:~/NodeListServer$ node ./listServer.js
This is Mirror List Server, NodeJS version by SoftwareGuy (Coburn).
Up and listening on HTTP port 8889!
[WARN] Denied request from ::1. Method: GET; Path: /
[INFO] Sending server list to ::1.
```

**To stop the server:**
1. Simply CTRL+C the running Node Process, or you can use `kill`/`pkill` to kill the node instance. I'd recommend using `ps aux` and `kill <pid>` carefully, because `pkill node` would try to kill all node instances on your box.

### Updating NodeListServer

1. Stop NodeListServer if it's running.
2. Execute `git pull` from the repository you cloned to your local machine or server instance. 
	- Note that if you obtained the source via a ZIP archive, then you're not going to be able to just execute `git pull`. Download and extract a new ZIP archive of this repository instead.
3. New commits will update your installation of NodeListServer after running `git pull`.
	- Rectify any pull merge errors if you have any (and you should know how to do this).
4. Start NodeListServer again.

## The API Explained

### API Endpoints

**Endpoint `/` and other endpoints not defined**
- These endpoint do nothing but return a error to try to deter people probing your installation of NodeListServer.

**Endpoint `/add`**
- **Method:** POST
- **Required POST elements:** serverUuid (Server's UUID), serverName (Server's Name), serverPort (Server's Listening Port)
- This is the endpoint that you use to add servers to the NodeListServer Cache.


**Endpoint `/list`**
- **Method:** GET
- This is the endpoint you use to get a server list. Note that we return a server list that doesn't have all the cache fields like the Server UUID. The reason behind that is if we did, someone could take the UUID and pass it to the `remove` Endpoint. And we don't want that, do we?

**Endpoint `/remove`**
- **Method:** POST
- **Required POST elements:** serverUuid (Server's UUID)
- This is the endpoint you use to remove a server from the NodeListServer Cache. You need to supply the server UUID for it to be removed.

### API Communication Examples
_Note: These examples uses CURL on a Shell/Command Line. Adapt it to your environment respectively. I strongly recommend using a UUID that is randomly generated (either via `uuid` on Linux, `System.Guid` in .NET, or whatnot) to avoid collisions. NodeListServer **will not** accept duplicate servers with the same UUID._

**Adding a server to the list**

```
curl -X POST --data "serverUuid=[RANDOM UUID GOES HERE]&serverName=[GAME SERVER NAME GOES HERE]&serverPort=[GAME SERVER PORT GOES HERE]" [instance IP address]:[NodeListServer Port, default 8889]/add
```

**Getting a list of servers**

```
curl [instance IP address]:[NodeListServer Port, default 8889]/list
(an example instance address: 127.0.0.1:8889/list)
```

**Removing a server from the list**

```
curl -X POST --data "serverUuid=[UUID GOES HERE]" [instance IP address]:8889/remove
```

## Using NodeListServer with Unity

It's pretty easy to use NodeListServer with Unity. You can use UnityWebRequest or another library (ie. Best HTTP Pro) to fetch the server lists and issue add/remove commands. As long as you can decode JSON it returns for the server list, you should be smooth sailing. 

Important: **DO NOT** auto-assume that POST functions will be successful. **Always check the HTTP status code before doing anything with the returned response**. 
- You will get HTTP Code 200 with a "OK" response from NodeListServer on success. 
- Anything not 200 will be NodeListServer denying your request (you'll most likely get HTTP Code 400, Bad Request).

As a bonus, here's some generic serializable classes that you can use to translate the JSON into something more usable:


```csharp

[Serializable]
public class NodeListServerListResponse {
	// Number of known servers.
	public int count;
	// The container for the known servers.
	public List<NodeListServerListEntry>() servers;
}


[Serializable]
public class NodeListServerListEntry {
	// IP address. Beware: Might be IPv6 format, and require you to chop off the leading "::" part. YMMV.
	public string ip;
	// Name of the server.
	public string name;
	// Port of the server.
	public int port;
}

```

Make sure you POST the correct data when you want to add/remove servers. See API Endpoints for more details on the required POST fields.

## Credits

- vis2k: Mirror Networking and the original List Server
- Mirror Team & Discord Members

***Thank you for choosing Australian Open Source Software.***