const childProcess = require("child_process");
module.exports = exports = (core, packageJsonPath) => {
  let version = require(packageJsonPath).version;
  let name = require(packageJsonPath).version;
  let npmCachePath;
  try {
    npmCachePath = childProcess.execSync("npm config get cache");
  } catch (e) {
    if (process.platform === "win32") {
      npmCachePath = path.join(process.env.LocalAppData, "npm-cache");
    } else {
      npmCachePath = path.join(process.env.HOME, ".npm");
    }
  }
  core.setOutput("version", version);
  core.setOutput(
    "tarball",
    `${name.replace("@", "").replace("/", "-")}-${version}.tgz`
  );
  core.setOutput("npm-cache-path", npmCachePath);
};
