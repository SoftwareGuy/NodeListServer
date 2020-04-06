# NodeListServer Configuration

## The Configuration File
The configuration file is presented in a INI format, which is a "header, key and value" format.

A proper config.ini is essential for the application to work. A improperly formatted one can cause a lot of issues as well as "undefined" errors.

### Configuration Parameters

#### Core
This category is used for the core settings of NodeListServer.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| ------------- | ---------------- |
| Core      	| listenPort 	|  8889	| Controls what port the list server application lists on.|

#### Auth
This category contains settings that control things like the Communication Key, Access Control, etc.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| ------------- | ---------------- |
| Auth      	| useAccessControl |  false	| Controls if Access Control Lists are enabled or disabled.|
| Auth      	| allowedIpAddresses | ::ffff:127.0.0.1 | A comma seperated list of IP addresses.  |
| Auth			| communicationKey	| NodeListServerDefaultKey | The communication key that all clients use. |

#### Pruning
This category allows you to fine-tune the pruning settings of the list server when passing servers back to the clients.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| ------------- | ---------------- |
| Pruning | inactiveServerRemovalMinutes | 15 | Value in minutes. If a server doesn't update its listing within this time period, it will be cleaned up the next call by a client requesting the server list. |
| Pruning | dontShowServersOnSameIp | false | If one has servers being hosted on the same IP as they're connecting from, it will not appear in the list. See note 1 for more info. |
| Pruning | ingameUpdateFrequency | 300 | Value in seconds. Controls the amount of time in between in-game updates. If a game was hardcoded to do updates every 10 minutes, servers would disappear before being updated if the List Server instance was set to kill server listings below the hardcoded value. It also can be used to help tune bandwidth. _This value does nothing on it's own, it's up to you to implement it in your client logic._ |

#### Security
This category is used for the security of NodeListServer. At the moment, the application uses these values to tune the rate limiter system.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| ------------- | ---------------- |
| Security     	| rateLimiterWindowMs | 900000 | Value in milliseconds. Clients have (amount) requests allocated to them within this time period. Default is 15 minutes. |
| Security     	| rateLimiterMaxApiRequestsPerWindow | 100 | Clients have this amount of requests allocated to them. They will get throttled if they exceed this amount. Used in conjuction with above setting. |


## Notes
### Note 1
If your IP address is 10.0.0.2 and you're hosting 3 servers on that machine (as in, all 3 server instances are on 10.0.0.2), with *dontShowServersOnSameIp* disabled you will see them appear in the server list. If *dontShowServersOnSameIp* is enabled, they would still be present on the server list, just filtered out when you request the Server List from your IP address.

## To be continued...
This document will hopefully be updated as new settings are introduced.