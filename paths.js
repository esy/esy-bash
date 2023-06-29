const path = require("path");
const cygMirror = "http://cygwin.mirror.constant.com";
const cygwinSetup = "setup-x86_64.exe";
const cygwinSetupDownloadURL = `https://cygwin.com/${cygwinSetup}`;
const installationDirectory = path.join(__dirname, ".cygwin");
let esyBashExePath = path.join(
  __dirname,
  "re",
  "_build",
  "default",
  "bin",
  "EsyBash.exe"
);
const localPackageDirectory = path.join(
  installationDirectory,
  "var",
  "cache",
  "setup"
);

module.exports = {
  cygMirror,
  cygwinSetup,
  cygwinSetupDownloadURL,
  installationDirectory,
  localPackageDirectory,
  esyBashExePath,
};
