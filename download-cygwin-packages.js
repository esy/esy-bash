const { downloadPackages } = require("./lib");

if (process.platform === "win32") {
  downloadPackages();
} else {
  console.log("Not Windows; Cygwin is not required.");
}
