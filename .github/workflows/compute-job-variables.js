const childProcess = require("child_process");
const fs = require("fs");
const PackageJson = require("./lib/package-json");

function appendEnvironmentFile(key, value) {
  let filename = process.env.GITHUB_OUTPUT;
  fs.appendFileSync(filename, `${key}=${value}\n`);
}

module.exports = exports = (packageJsonPath) => {
  let packageJson = new PackageJson(packageJsonPath);
  let name = packageJson.name;
  let version = packageJson.version;
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
  appendEnvironmentFile("version", version);
  appendEnvironmentFile(
    "tarball",
    `${name.replace("@", "").replace("/", "-")}-${version}.tgz`
  );
  appendEnvironmentFile("npm-cache-path", npmCachePath);
};
