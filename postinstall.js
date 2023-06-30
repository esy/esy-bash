const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { installPackages, installWindowsDefaultManifest } = require("./lib");
const { localPackageDirectory } = require("./paths.js");

if (!fs.existsSync(path.join(__dirname, ".cygwin"))) {
  // This is necessary because on the CI (or during local
  // development, runnning `npm install` will trigger postinstall
  // too. We dont want this to fail, esp on CI where it will break
  // the pipeline unnecessarily. The point of this `npm install`
  // command was only to setup dependencies needs to work with
  // esy-bash. A working postinstall at this stage (beginning of
  // development) isn't necessary.
  console.warn("No cygwin folder found, nothing to be done.");
  return 0;
}

function globalErrorHandler(err) {
  console.log("globalErrorHandler", err);
  process.exit(1);
}

process.on("unhandledRejection", globalErrorHandler);

async function main() {
  if (process.platform !== "win32") {
    console.log("No unpack needed");
    return 0;
  } else {
    await installPackages(localPackageDirectory);
    await installWindowsDefaultManifest(localPackageDirectory);
    return 0;
  }
}

main().then(process.exit).catch(globalErrorHandler);
