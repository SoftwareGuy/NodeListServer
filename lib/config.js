module.exports = {
  configuration: {
    Core: {
      ipV4: true,
      listenPort: 8889,
    },
    Auth: {
      useAccessControl: false,
      allowedIpAddresses: ["127.0.0.1"],
      communicationKey: "NodeListServerDefaultKey",
    },
    Pruning: {
      ingameUpdateFrequency: 300,
      dontShowServersOnSameIp: false,
      inactiveServerRemovalMinutes: 15,
    },
    Security: {
      useRateLimiter: true,
      rateLimiterWindowMs: 900000,
      allowDuplicateServerNames: false,
      updatesMustMatchOriginalAddress: true,
      rateLimiterMaxApiRequestsPerWindow: 100,
    },
  },
};
