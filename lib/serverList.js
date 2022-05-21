const { configuration } = require("./config");
const { loggerInstance } = require("./logger");
const { generateUuid, pruneInterval, inactiveServerRemovalMs } = require("./utils"); // some utils

// ------------
// Our server list object, We'll import it to any other file that needs it.
// Use this object to add/remove servers from the list. eg. knownServers.add(newServer);
// ------------
var ServerList = {
  _list: [],

  get list() {
    return this._list;
  },

  sendList(req, res) {
    // Shows if keys match for those getting list server details.
    loggerInstance.info(`${req.ip} accepted; communication key matched: '${req.body.serverKey}'`);

    // Clean out the old ones.
    this.prune();

    // A client wants the server list. Compile it and send out via JSON.
    var serverList = this._list.map((knownServer) => {
      return {
        ip: knownServer.ip,
        name: knownServer.name,
        port: parseInt(knownServer.port, 10),
        players: parseInt(knownServer.players, 10),
        capacity: parseInt(knownServer.capacity, 10),
        extras: knownServer.extras,
      };
    });

    // If dontShowServersOnSameIp is true, remove any servers that are on the same IP as the client.
    if (configuration.Pruning.dontShowServersOnSameIp) {
      serverList = serverList.filter((server) => server.ip !== req.ip);
    }

    // Build response with extra data with the server list we're about to send.
    var response = {
      count: serverList.length,
      servers: serverList,
      updateFrequencySeconds: inactiveServerRemovalMs / 1000 / 2, // How often a game server should update it's listing
    };

    loggerInstance.info(`Replying to ${req.ip} with known server list.`);
    return res.json(response);
  },

  // Add a new server to the list.
  addServer(req, res) {
    // Our request validator already checks if a uuid exists
    // So we'll just check if there's a uuid in the request body and pass it to the update function
    if (req.body.serverUuid)
      // Hand it over to the update routine.
      return this.updateServer(req, res);

    // Time to wrap things up.
    var newServer = {
      uuid: generateUuid(this.list),
      ip: req.ip,
      name: req.body.serverName.trim(),
      port: parseInt(req.body.serverPort, 10),
    };

    // Extra field santitization
    newServer["players"] = parseInt(req.body.serverPlayers, 10) || 0;
    newServer["capacity"] = parseInt(req.body.serverCapacity, 10) || 0;
    newServer["extras"] = req.body.serverExtras?.trim() || "";
    newServer["lastUpdated"] = Date.now();

    this._list.push(newServer);
    // Log it and send back the UUID to the client - they'll need it for later.
    loggerInstance.info(
      `Handled add server request from ${req.ip}: ${newServer["uuid"]} ('${newServer["name"]}')`
    );
    return res.send(newServer["uuid"]);
  },

  // Update a server's details.
  updateServer(req, res) {
    // Remove the server and save it to a variable
    const index = this._list.findIndex((server) => server.uuid === req.body.serverUuid);
    var [updatedServer] = this._list.splice(index, 1);

    // Create an object with our requestData data
    var requestData = {
      name: req.body.serverName?.trim(),
      players: !isNaN(req.body.serverPlayers) && parseInt(req.body.serverPlayers, 10),
      capacity: !isNaN(req.body.serverCapacity) && parseInt(req.body.serverCapacity, 10),
      extras: req.body.serverExtras?.trim(),
      lastUpdated: Date.now(),
    };

    // Cross-check the request data against our current server values and update if needed
    Object.entries(requestData).forEach(([key, value]) => {
      if (value && value !== updatedServer[key]) {
        updatedServer[key] = value;
      }
    });

    // Push the server back onto the stack.
    this._list.push(updatedServer);
    loggerInstance.info(
      `Handled update request for server '${updatedServer.uuid}' (${updatedServer.name}) requested by ${req.ip}`
    );
    return res.sendStatus(200); // 200 OK
  },
  // removeServer: Removes a server from the list.
  removeServer(req, res) {
    this._list = this.list.filter((server) => server.uuid !== req.body.serverUuid);
    loggerInstance.info(
      `Deleted server '${req.body.serverUuid}' from cache (requested by ${req.ip}).`
    );
    return res.send("OK\n");
  },

  prune() {
    const oldLength = this.list.length;
    this._list = this._list.filter(
      (server) => server.lastUpdated + inactiveServerRemovalMs >= Date.now()
    );

    // if we removed any servers then log how many
    if (oldLength > this.list.length)
      loggerInstance.info(`Purged ${oldLength - this.list.length} old server(s).`);
  },

  // Automtically remove old servers if they haven't updated based on the time specified in the configuration
  async pruneLoop() {
    this.prune();
    await new Promise((resolve) => setTimeout(resolve, pruneInterval)); // async delay
    this.pruneLoop();
  },

  getServerPruneTime(existingServer) {
    const lastUpdated = this.list.find((server) => server.ip == existingServer.ip)?.lastUpdated;
    const serverLife = (lastUpdated + (inactiveServerRemovalMs - Date.now())) / 1000;
    if (lastUpdated) return Math.ceil(serverLife + 1);
  },
};

// Start the first purge iteration
ServerList.pruneLoop();

module.exports = ServerList;
