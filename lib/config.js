const configuration = {
  Core: {
    ipV4: true, // Set to true to listen for IPv4 connections, false to listen for IPv6
    listenPort: 8889, // The port to listen on
  },
  Auth: {
    useAccessControl: false, // Set to true to use access control, false to disables
    allowedIpAddresses: ["127.0.0.1"], // if useAccessControl is true, allow these IP addresses only
    communicationKey: "NodeListServerDefaultKey", // The secret key used to validate an incoming request
  },
  Pruning: {
    dontShowServersOnSameIp: false, // When a client requests the server list, remove the server they're on from the list.
    inactiveServerRemovalMinutes: 5, // How many minutes a server should be considered inactive before it's removed from the list.
    sendNextPruneTimeInSeconds: true, // Send the servers remaining life in seconds if a collision check was detected.
  },
  Security: {
    useRateLimiter: true, // Limit the amount of requests from the same IP
    rateLimiterWindowMs: 900000, // The window in Ms before the rate limit is reset
    allowDuplicateServerNames: false, // Allow duplicate server names to be added to the list
    updatesMustMatchOriginalAddress: true, // Any server updates must match the original server's IP
    rateLimiterMaxApiRequestsPerWindow: 100, // The amount of requests allowed from the same IP before being blocked
  },
};

module.exports = { configuration };
