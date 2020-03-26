# NodeListServer Configuration

## The Configuration File
The configuration file is presented in a INI format, which is a "header, key and value" format.

A proper config.ini is essential for the application to work. A improperly formatted one can cause a lot of issues as well as "undefined" errors.

### Configuration Parameters

#### Core
This category is used for the core settings of NodeListServer.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| -----:| ---------------- |
| Core      	| listenPort 	|  8889	| Controls what port the list server application lists on.|

#### Auth
This category contains settings that control things like the Communication Key, Access Control, etc.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| -----:| ---------------- |
| Auth      	| useAccessControl |  false	| Controls if Access Control Lists are enabled or disabled.|
| Auth      	| allowedIpAddresses | ::ffff:127.0.0.1 | A comma seperated list of IP addresses.  |
| Auth			| communicationKey	| NodeListServerDefaultKey | The communication key that all clients use. |

#### Pruning
This category allows you to fine-tune the pruning settings of the list server when passing servers back to the clients.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| -----:| ---------------- |
| Core      	| listenPort 	|  8889	| Controls what port the list server application lists on.|


#### Security
This category is used for the security of NodeListServer. At the moment, the application uses these values to tune the rate limiter system.

| Header        | Key           | Default Value | What does it do? |
| ------------- |:-------------:| -----:| ---------------- |
| Security     	| rateLimiterWindowMs | 900000 | Value in milliseconds. Clients have (amount) requests allocated to them within this time period. Default is 15 minutes. |
| Security     	| rateLimiterMaxApiRequestsPerWindow | 100 | Clients have this amount of requests allocated to them. They will get throttled if they exceed this amount. Used in conjuction with above setting. |


# To be continued...
This document will hopefully be updated as new settings are introduced.

[Pruning]
inactiveServerRemovalMinutes=15
dontShowServersOnSameIp=false

[Security]
rateLimiterWindowMs=900000
rateLimiterMaxApiRequestsPerWindow=100