const fs = require("fs-extra");
const path = require("path");
const { downloadPackages } = require("./lib");
const { installationDirectory, localPackageDirectory } = require("./paths.js");

function globalErrorHandler(err) {
  console.log("globalErrorHandler", err);
  process.exit(1);
}

async function main() {
  const downloadCache = path.join(__dirname, ".cygwin-cache");
  // First download to a cache area for CI
  // 'npm pack' will never include it in the tarball
  // because it isn't include in the list of files to
  // be included
  await downloadPackages(downloadCache);
  // Copy them over to cache area for client side installation
  // ie. copy over to .cygwin/var/cache/setup
  await fs.mkdirp(path.dirname(localPackageDirectory));
  await fs.copy(downloadCache, localPackageDirectory);
}

if (process.platform === "win32") {
  main().then(process.exit).catch(globalErrorHandler);
} else {
  console.log("Not Windows; Cygwin is not required.");
}
