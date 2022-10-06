# This file is part of NodeListServer, available at https://github.com/SoftwareGuy/NodeListServer
# PRs, bug fixes and improvements are welcome. Don't delay, get those pull requests in today!

# We'll use Node 18 for this docker container.
FROM node:18

# This exposes NodeListServer to the outside world.
EXPOSE 8889

# Set working directory
WORKDIR /app

# Copying package.json
COPY ["package.json", "package-lock.json*", "./"]

# Installing dependencies
RUN npm install --omit=dev

# Copying rest of files
COPY . .

# Boot.
CMD [ "node", "init.js" ]

# End of Dockerfile