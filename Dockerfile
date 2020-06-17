# This file is part of NodeListServer, available at https://github.com/SoftwareGuy/NodeListServer
# PRs, bug fixes and improvements are welcome. Don't delay, get those pull requests in today!

# We'll use Node 12 for this docker container.
FROM node:12

# This exposes NodeListServer to the outside world.
EXPOSE 8889

# Copy and configure some stuff.
RUN mkdir -p /opt/nodelistserver

COPY listServer.js /opt/nodelistserver/listServer.js
COPY package.json /opt/nodelistserver/package.json
COPY package-lock.json /opt/nodelistserver/package-lock.json
COPY config.ini /opt/nodelistserver/config.ini
COPY docker-entrypoint.sh /entrypoint.sh

# Make it executable!
RUN chmod +x /entrypoint.sh

# Boot.
ENTRYPOINT ["/entrypoint.sh"]

# End of Dockerfile