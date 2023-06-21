const { installPackages } = require("./lib");

if (process.platform === "win32") {
  installPackages();
} else {
  console.log("Not Windows; Cygwin is not required.");
}
