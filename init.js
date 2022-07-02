/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
// NodeListServer: NodeJS-based List Server Application
// Developed by Matt Coburn and project contributors.
// --------------
// This software is MIT Licensed. 
// Copyright (c) 2019 - 2022 Matt Coburn (SoftwareGuy/Coburn64)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const REVISION_VER = 0;

// ---------------
// Require some essential libraries and modules.
// ---------------
// - Import what we need from our other files
const { configuration } = require("./lib/config"); // our configuration
const { expressApp } = require("./lib/express"); // our express server
const Serverlist = require("./lib/serverList");

// -- Start the application -- //
// Attach the functions to each path we use with NodeLS.
expressApp.post("/list", (req, res) => Serverlist.sendList(req, res));
expressApp.post("/add", (req, res) => Serverlist.addServer(req, res));
expressApp.post("/remove", (req, res) => Serverlist.removeServer(req, res));

// Finally, start the application
console.log(`Welcome to NodeListServer Generation 2.1 Revision ${REVISION_VER}`);
console.log(
  "Report bugs and fork the project on GitHub: https://github.com/SoftwareGuy/NodeListServer"
);

expressApp.listen(configuration.Core.listenPort, configuration.Core.ipV4 ? "0.0.0.0" : "::", () =>
  console.log(`NodeLS is now listening on port ${configuration.Core.listenPort}.`)
);
