# NodeListServer
[![Ko-Fi](https://img.shields.io/badge/Donate-Ko--Fi-red)](https://ko-fi.com/coburn) 
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue)](https://paypal.me/coburn64)
![MIT Licensed](https://img.shields.io/badge/license-MIT-green.svg)

This is a reimplementation of the Mirror List Server using NodeJS with 100% Fresh, Organic, Free-Range Australian Code.

## Features

- **Open Source:** Mirror's own List Server is closed source. This is open source where you can look at my code and suggest improvements, fix bugs, etc.
- **Fast:** NodeJS is quick and nimble, and so is this List Server.
- **Unity WebGL support:** Since we're using HTTP calls, Unity WebGL games can use it this too. *Mirror's own List Server uses TCP, which makes it incompatible with WebGL games.*
- Not just limited to games, you could use it for other non-Unity applications too!

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
1. Clone this repository via the clone URL provided. On Windows and Mac you can use Git GUI or SourceTree. On Linux, just make sure you have git installed, then use the Terminal to get that freshly baked source code.
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
*Note: It's recommended to use a process manager like **PM2** which will allow you start and stop the server elegantly, and restart it in case of crashes, etc.*

**To start the server:**
1. Invoke NodeJS with `listServer.js`. This is dependent on your operating system, but if Node is installed in your path, you can simply do `node listServer.js`.
2. Observe the logs. If the list server does not say `Up and listening [...]` then something went wrong. Check to see if the port is open that you want NodeListServer to listen on. **You cannot have more than one list server listening on the same port number.**
3. Try poking the server via `http://[your server ip]:8889` or whatever port you configured it as. If you're running it locally you can do `http://127.0.0.1:8889` with the shipped configuration.

**To stop the server:**
1. Simply CTRL+C the running Node Process, or you can use kill/pkill to kill the node instance. I'd recommend using `ps aux` and `kill` carefully, because `pkill node` would try to kill all node instances on your box.

### Updating NodeListServer
1. Stop NodeListServer if it's running.
2. Execute `git pull` from the repository you cloned to your local machine or server instance.  Note that if you obtained the source via a ZIP archive, then you're not going to be able to just execute `git pull`. Download and extract a new ZIP archive of this repository instead.
3. Any new updates will be applied automatically, unless you have edited the code in which a merge conflict may occur. You will need to rectify this manually (and you should know how to do this).
4. Start NodeListServer again.

## The API Explained

### API Endpoints
TODO.

### API Communication Examples
TODO.

## Using NodeListServer with Unity
TODO.

## Credits
- vis2k: Mirror Networking and the original List Server
- Mirror Team & Discord Members

***Thank you for choosing Australian Open Source Software.***