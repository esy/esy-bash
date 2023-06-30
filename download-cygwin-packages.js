const fs = require("fs-extra");
const path = require("path");
const { downloadPackages, downloadWindowsDefaultManifest } = require("./lib");
const { installationDirectory, localPackageDirectory } = require("./paths.js");
const { log } = require("./utils");

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
  // For long paths support
  log(
    "Downloading ManasJayanth/windows-default-manifest for long paths support"
  );
  let wdmTarball = await downloadWindowsDefaultManifest(downloadCache);
  log(`Downloaded: ${wdmTarball}`);
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
