# NodeListServer Generation 2.1

![MIT Licensed](https://img.shields.io/badge/license-MIT-green.svg)
[![Ko-Fi](https://img.shields.io/badge/Donate-Ko--Fi-red)](https://ko-fi.com/coburn) 
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue)](https://paypal.me/coburn64)

NodeLS, short for Node List Server, is a game server directory application that aims to provide a reliable way of registering, deregistering and informing clients of servers available for your game(s).

## Why NodeLS?

When developing a game, let's say a First Person Shooter, you might want to have clients host their own servers. These servers might be 
host-client ("listen") or pure dedicated instances. However, here comes the next problem...

How the heck do you display servers that are available for you to join?

Enter NodeLS. It's a flexible and open source server listing system that works with pretty much any software that can understand JSON. NodeLS also brings you 
assurance that you control the data that is being sent and received, not a third party other than the server provider you deal with.

_**Please consider a donation (see the Ko-Fi button above) if this server software is useful to you.**_

## Support Update
While issue tickets are the preferred way of support, you may also ask for support on the [Oiran Studio Discord](https://discord.gg/kUvJYjrbHE). It may be a faster way of getting support if I'm not busy with other client tasks. Sometimes issue ticket notifications get snowed under a truck load of new email.

## Features

-   **Fast:** We use NodeJS to power this baby.
-   **OSS Core:** Feel free to tailor it to your needs, it's open source. Find a bug? Fix it, shoot me a PR, let me review and if it looks good, congrats!
-   **Game Engine Agnostic:** Thanks to the HTTP API, any engine that can do HTTP requests can take advantage of NodeLS.
-   **WebGL compatible:** No complex magic required. NodeLS uses a simple API to query, add and remove servers. 
-   **Secure:** ACLs (Access Control Lists) can be used as well as key authenication to prevent anyone adding/removing servers from your instances. Servers must provide a key in order to register, and rate limiting clients helps keep traffic floods at bay.
-   **Configurable:** Hard-coded options are kept to a minimum, allowing greater flexibility.

## Non-Features

-   **Matchmaking:** Outside the realm that this program sits in.
-   Anything else that it doesn't offer.

## Bug Fixes, New Features, etc

-   **Found a bug?** Please report it via the Issues ticket system. If you ***think that you can fix it*** then give it a shot. I'd really appreciate a pull request!
-   **Refactors, Improvements, Tweaks:** Improvements and refinements are welcome - open a issue and suggest your modifications or fork this project, improve it, then shoot in a PR.
-   **Ooh, shiny new feature:** New features are carefully considered. NodeLS tries not to be a bloated end product, but some features are nice to have...

## Setup

### Docker Support

***TODO: Review docker support and update it***

If you want to have everything handled for you and you're running a linux server, see [the Docker support documentation](DOCKER-SUPPORT.md) file for more info. Please note that this will require some additional setup.

### Requirements

1.  Node 16 or newer (most recent LTS is recommended)
2.  A server instance, be it Windows or Linux
3.  Some knowledge about programming, fair amount of patience and Git-fu

**Make sure your installation of Node is functional before continuing!**

## Installation

### Git Clone Method
1.    Run this in the console of your operating system where you want the code to be placed (for example, `C:\NodeListServer`).
```
git clone https://github.com/SoftwareGuy/NodeListServer .
```

NOTE: It is possible to use a GUI such as Git GUI or SourceTree. Use whatever you're familiar with.

2. Continue with configuration step below.

### ZIP Installation Method

1.  Obtain a ZIP archive of this repository via the "Download as ZIP" option.
2.  Extract it somewhere on your system.

**Note: The ZIP Installation Method loses the git metadata, so you will not be able to have easy updates.**

## Configuration

***TODO: Update this***

1. Open `lib/config.js`.
2. Carefully make any adjustments to the configuration as desired (see [the configuration page](CONFIGURATION.md) for more information).
3. Save and Exit. Re-upload your modified `config.js` (ie. you edited it via FTP).

## Operating & Updating

*Note: It's recommended to use a process manager like **PM2** which will allow you start and stop the server elegantly, and restart it in case of crashes, etc.*

### Starting & Stopping

**First Run:**
1.  Install the Node modules by issuing `npm install --only=production`. This will read the requirements from packages.json.

**To start the server:**

_Protip: Check to see if the port is open that you want NodeListServer to listen on. **You cannot have more than one list server listening on the same port number.**_

1.  Start the server using `npm start` or `node init`. 
2.  Observe the logs that are printed to the console, if the list server does not say anything then something went wrong. A successful startup is as follows:

```
NodeListServer Gen2: Mirror List Server reimplemented in NodeJS
Report bugs and fork me on GitHub: https://github.com/SoftwareGuy/NodeListServer
Listening on HTTP port 8889!
```

3.  Issue a HTTP POST command like the following to `http://[your-server-ip]:8889/list`. cURL is very useful as a debug tool, so here's a one liner. Replace `NodeListServerDefaultKey` with your changed key if you changed that.

```
curl -X POST -d "serverKey=NodeListServerDefaultKey" http://127.0.0.1:8889/list
```

If all goes well, you should get some JSON as a result. If you don't, or you get `Bad Request` then check what the console says - you dun goofed probably.

**To stop the server:**

Simply CTRL+C the running Node process, or you can use `kill`/`pkill` to kill the node instance. I'd recommend using `ps aux` and `kill <pid>` carefully, because `pkill node` would try to kill all node instances on your box - and that can be really no bueno.

### Updating NodeListServer

1.  Stop NodeListServer if it's running.
2.  Execute `git pull` from the repository you cloned to your local machine or server instance. 
    -   Note that if you obtained the source via a ZIP archive, then you're not going to be able to just execute `git pull`. Download and extract a new ZIP archive of this repository instead.
3.  New commits will update your installation of NodeListServer after running `git pull`.
    -   Rectify any pull merge errors if you have any (and you should know how to do this).
4.  Start NodeListServer again.

## The API Explained

Section omitted because it needs cleanup. Check back later.

## Using NodeListServer with Unity

Want a easy, ready to go project? Then grab a copy of the  [NodeListServer-Example](https://github.com/SoftwareGuy/NodeListServer-Example) repository.

In fairness, It's pretty easy to use NodeListServer with Unity. You can use UnityWebRequest or another library (ie. Best HTTP Pro) to fetch the server lists and issue add/remove commands. As long as you can decode JSON it returns for the server list, you should be fine.

Important: Do **NOT** auto-assume that POST functions will be successful. **Always check the HTTP status code before doing anything with the returned response**. 

-   You will get HTTP code 200 with a "OK" response from NodeListServer on success. 
-   Anything not HTTP code 200 will be NodeListServer denying your request (you'll most likely get HTTP Code 400, Bad Request or if your IP is blocked, 403 Forbidden).
-   Make sure you cache the Server UUID you use. You'll need to use that to tell the List Server what to do with your server entry. Without a valid Server UUID, it will refuse to do anything.
-   I strongly recommend using GUIDs, which are unique and if you're using Mono or .NET, you can just use `System.Guid.newGuid()` to generate a random one.

As a bonus, here's some generic serializable classes that you can use to translate the JSON into something more usable:

```csharp

[Serializable]
public class ServerListResponse
{
    // Number of known servers.
    public int count;
    // The container for the known servers.
    public List<ServerListEntry> servers;
    // Ideally used for client-hosted games, tells you how often you should refresh your server information.
    public int updateFrequency;
}

[Serializable]
public class ServerListEntry
{
	// Random generated UUID
	public string serverUuid; 
	// IP address. Beware: Might be IPv6 format, and require you to chop off the leading "::ffff:" part. YMMV.
	public string ip;
	// Port of the server.
	public int serverPort;
	// Name of the server.
	public string serverName;
	// Number of players on the server.
	public int serverPlayers;
	// The number of players maximum allowed on the server.
	public int serverCapacity;
	// Extra data.
	public string extras;
}
```

Make sure you POST the correct data when you want to add/remove servers. See API Endpoints for more details on the required POST fields.

## Credits

- vis2k: Mirror Networking and the original List Server
-	JesusLuvsYooh: That other blacksmith that's forging NodeLS into shape and always annoying me with questions
-	AnthonyE: First actual deployment of NodeLS in production!
- Mirror Team & Discord Members


***Thank you for choosing Australian Open Source Software.***



<h1> NodeLS Basic server Instructions:- </h1>
 
- First of all make sure you have Nodejs downloaded and Installed
- Open Folder through VSCode
- run ``` npm install ``` to install dependencies 
- run ``` node listServer.js ``` to start your NodeLS server  

</hr>

<h1>API Quickstart Instructions:-</h1>
<h3> Firing Up NodeLS Using PostMan : </h3>

1) POST - http://127.0.0.1:8889/add - x-WWW-FORM </br>
<pre><code class="hljs language-shell">
    ip => ip addres of the node
    serverKey => NodeListServerDefaultKey (specified in the Configuration file)
    serverName => Lulu
    serverPort => 7777 
    serverPlayers => 2 (optional)
    serverCapacity => 20 (optional)
</code></pre>


*Congratulations! you now have ~ serverUuid || "uuid" ~~ of the created server called "Lulu"* !!

</hr>

2) POST - http://127.0.0.1:8889/list - x-WWW-FORM </br>
<pre><code class="hljs language-shell">
serverKey => NodeListServerDefaultKey (specified in the Configuration file)
</code></pre>

* Now you have list of created servers as the following...*

<pre><code class="hljs language-shell">
"Example callback" => {
    "count": 2,
    "servers": [
        {
            "ip": "::ffff:127.0.0.1",
            "name": "Lulu",
            "port": 7777,
            "players": 0,
            "capacity": 0,
            "extras": ""
        },
        {
            "ip": "::ffff:127.0.0.1",
            "name": "Lulus",
            "port": 7337,
            "players": 2,
            "capacity": 20,
            "extras": ""
        }
    ],
    "updateFrequency": "300"
}
</code></pre>

</hr>

3) POST - http://127.0.0.1:8889/remove - x-WWW-FORM </br>
<pre><code class="hljs language-shell">
	serverKey => NodeListServerDefaultKey (specified in the Configuration file)
	serverUuid => de94592c-7672-419b-8fe2-234b48e46607 (the Generated uuid)
</code></pre>

* Successfully Removed that server !!*
- Looking forward to continue adding to this Documentation and developing this awesome tool with Github community
