const { installPackages } = require("./lib");
const { localPackageDirectory } = require("./paths.js");

if (process.platform === "win32") {
  installPackages(localPackageDirectory);
} else {
  console.log("Not Windows; Cygwin is not required.");
}
