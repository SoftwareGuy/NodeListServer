# NodeListServer Generation 3

![MIT Licensed](https://img.shields.io/badge/license-MIT-green.svg)
[![Ko-Fi](https://img.shields.io/badge/Donate-Ko--Fi-red)](https://ko-fi.com/coburn) 
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue)](https://paypal.me/coburn64)

NodeLS (Node List Server) is a game server directory application that aims to provide a reliable way of registering, deregistering and informing clients of servers available for your game(s).

## Why NodeLS?

When developing a game, let's say a First Person Shooter, you might want to have clients host their own servers or you have a fleet of your own servers. These
servers might be host-client ("listen") or pure dedicated instances. However, here comes the next problem...

How the heck do you display servers that are available for you to join?

Node List Server (NodeLS for short) is a server directory application that allows you to create a "directory" of servers for your project, be it a game or something else.
Originally designed to provide an open source alternative to the now-sunset Mirror List Server paid service, NodeLS is is licensed under MIT, so you are welcome to fork, modify and contribute back to the original project.

_**Please consider a donation (see the Ko-Fi button above) if this software is useful to you.**_

## Is this just for games? Or can I use it for X?

While NodeLS is indeed geared towards game servers, there is no problem in using it for another project be it a standard application, VR experience or something else.

## Features

-   **Open Source:** Feel free to tailor it to your needs, it's open source. Find a bug? Fix it, shoot me a PR and I'll merge it if it looks good.
-	**Game Engine Agnostic:** Any application/game engine that can do HTTP GET requests can take advantage of NodeLS.
-   **Fast:** Mirror's retired List Server was written in Erlang. We use NodeJS and Express to power this baby.
-   **Secure:** ACLs (Access Control Lists) can be used as well as key authenication to prevent anyone adding/removing servers from your instances. Servers must provide a key in order to register, and rate limiting clients helps keep traffic floods at bay.
-	**Configurable:** Generation 3 of Node List Server uses a JSON file for configuration, making it easy to configure.
-   **WebGL compatible:** No complex magic required. NodeLS uses a simple HTTP API to add and remove servers. 
-   **Used in production:** Various games and applications are using this tech already.

## Non-Features

-   **Matchmaking:** There is no matchmaking capabilities in NodeLS.
-   Something else maybe not listed here

## Bug Fixes, New Features, etc

-   **If you find a bug:** Please report it via the Issues ticket system. If you ***think that you can fix it*** then give it a shot at fixing it. I'd really appreciate a pull request!
-   **Refactors, Improvements, Tweaks:** I'm all ears to improvements and refinements. Please open a issue and suggest your modifications or fork this project, improve it, then open a PR.
-   **Ooh, shiny new features:** New features are carefully considered. I try to keep the core as simple as possible which helps not only keep code clean but doesn't bloat the end product. 

## Setup

### Docker Support

If you want to have everything handled for you and you're running a linux server, see [the Docker support documentation](DOCKER-SUPPORT.md) file for more info. Please note that this will require some additional setup.

### Requirements

1.  NodeJS (LTS recommended. **Make sure it's installed and running first.**)
2.  A server instance, be it Windows or Linux
3.  Some knowledge about programming, fair amount of patience and Git-fu

**Make sure your installation of NodeJS is functional before continuing!**

## Installation

### Git Clone Method (GUI)
1. Use your favourite GUI Git Client to clone the repository.

### Git Clone Method (CLI)
1.	Run this in the console of your operating system where you want the code to be placed (for example, `C:\NodeListServer`).
```
git clone https://github.com/SoftwareGuy/NodeListServer .
```

2. Continue with configuration step below.

### ZIP Installation Method

1.  Obtain a ZIP archive of this repository via the "Download as ZIP" option.
2.  Extract it somewhere on your system.

**Note:** The ZIP Installation Method loses it's Git metadata, so you will not be able to have easy updates.

## Configuration

***TODO: UPDATE THIS SECTION***

## Operating & Updating

*Note: It's recommended to use a process manager like **PM2** which will allow you start and stop the server elegantly, and restart it in case of crashes, etc.*

### Starting & Stopping

#### First Run
Install the required node modules by issuing `npm install --only=production` inside the directory where you cloned the repository. This will read the requirements from packages.json.

#### Starting NodeLS

_Protip: Check to see if the port is open that you want NodeListServer to listen on. **You cannot have more than one list server listening on the same port number.**_

1.  Invoke NodeJS with `listServer.js`. This is dependent on your operating system, but if Node is installed in your path, you can simply do `node listServer`. Any recent Node installation will work, but I recommend the LTS versions rather than "Current" ones.
2.  Observe the logs that are printed to the console, if the list server does not say anything then something went wrong.

3.  Issue a HTTP POST command like the following to `http://[your-server-ip]:8889/list`. cURL is very useful as a debug tool, so here's a one liner. Replace `NodeListServerDefaultKey` with your changed key if you changed that.

```
curl -X POST -d "serverKey=NodeListServerDefaultKey" http://127.0.0.1:8889/list
```

If all goes well, you should get some JSON as a result. If you don't, or you get `Bad Request` then check what the console says - you dun goofed probably.

#### Stopping NodeLS

Simply CTRL+C the running Node process, or you can use `kill`/`pkill` to kill the node instance. I'd recommend using `ps aux` and `kill <pid>` carefully, because `pkill node` would try to kill all node instances on your box - and that's really no bueno. If you're using PM2 to manage NodeLS, use `pm2 stop <id of NodeLS instance, eg. 1>`

#### Updating NodeLS

1.  Stop NodeListServer if it's running.
2.  Execute `git pull` from the repository you cloned to your local machine or server instance. 
    -   Note that if you obtained the source via a ZIP archive, then you're not going to be able to just execute `git pull`. Download and extract a new ZIP archive of this repository instead. Skip to step 4 if that is the case.
3.  New commits will update your installation of NodeListServer after running `git pull`.
    -   Rectify any pull merge errors if you have any (and you should know how to do this).
4.  Start NodeListServer again.

## The API Explained

Section omitted because it needs cleanup. Check back later.

## Using NodeListServer with Unity

***TODO: Outdated. Update this!***

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
public class NodeListServerListResponse
{
    // Number of known servers.
    public int count;
    // The container for the known servers.
    public List<NodeListServerListEntry> servers;
    // Ideally used for client-hosted games, tells you how often you should refresh your server information.
    public int updateFrequency;
}

[Serializable]
public class NodeListServerListEntry
{
    // IP address. Beware: Might be IPv6 format, and require you to chop off the leading "::ffff:" part. YMMV.
    public string ip;
    // Name of the server.
    public string name;
    // Port of the server.
    public int port;
    // Number of players on the server.
    public int players;
    // The number of players maximum allowed on the server.
    public int capacity;
    // Extra data.
    public string extras;
}
    
```

Make sure you POST the correct data when you want to add/remove servers. See API Endpoints for more details on the required POST fields.

## Credits

-   tatelax: Security patches, improvements.
-	JesusLuvsYooh: Improvements, suggestions
-	AnthonyE: First actual deployment of NodeLS in production!
-	vis2k: MirrorLS for which NodeLS was modelled after
-   Mirror Team & Discord Members

***Thank you for choosing Australian Open Source Software.***
