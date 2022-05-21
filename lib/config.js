const configuration = {
  Core: {
    // Set to true to listen for IPv4 connections, false to listen for IPv6
    ipV4: true,

    // The port to listen on
    listenPort: 8889,
  },
  Auth: {
    // Set to true to use access control, false to disables
    useAccessControl: false,

    // An array of IP addresses that are allowed to connect to the server if (If useAccessControl is true)
    allowedIpAddresses: ["127.0.0.1"],

    // The secret key used to validate an incoming request
    communicationKey: "NodeListServerDefaultKey",
  },
  Pruning: {
    // When a client requests the server list, remove the server they're on from the list.
    dontShowServersOnSameIp: false,

    // How many minutes a server should be considered inactive before it's removed from the list.
    inactiveServerRemovalMinutes: 5,

    // Send the next prune time in seconds if a collision check was detected.
    sendNextPruneTimeInSeconds: true,
  },
  Security: {
    // Limit the amount of requests from the same IP
    useRateLimiter: true,

    // The window in Ms before the rate limit is reset
    rateLimiterWindowMs: 900000,

    // Allow duplicate server names to be added to the list
    allowDuplicateServerNames: false,

    // Any server updates must match the original server's IP
    updatesMustMatchOriginalAddress: true,

    // The amount of requests allowed from the same IP before being blocked
    rateLimiterMaxApiRequestsPerWindow: 100,
  },
};

module.exports = { configuration };
