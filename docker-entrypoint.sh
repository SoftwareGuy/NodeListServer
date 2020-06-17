#!/bin/bash
NPM_BIN=$(which npm)
NODE_BIN=$(which node)

echo "Starting NodeListServer. Please wait..."
# Make sure we're in the installation directory
cd /opt/nodelistserver
echo "Updating modules..."
$NPM_BIN install --only=production

if [ $? -eq 0 ]; then
        echo "Modules and dependencies satisfied, continuing startup."
        echo "Starting the main application."
        $NODE_BIN listServer.js
else
        echo "!!! FAILED TO START NODE LIST SERVER !!!"
        echo "Likely this is due to some issue with npm modules."
        echo "You might want to file a bug report on the GitHub."
        echo "Goodbye!"
fi

exit $?