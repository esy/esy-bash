const os = require("os");
const path = require("path");
const download = require("download");
const cp = require("child_process");
const fs = require("fs-extra");
const packagesToInstall = require("./packages-to-install");

const cygMirror = "http://cygwin.mirror.constant.com";
const cygwinSetup = "setup-x86_64.exe";
const cygwinSetupDownloadURL = `https://cygwin.com/${cygwinSetup}`;
const installationDirectory = path.join(__dirname, ".cygwin");
const localPackageDirectory = path.join(
  installationDirectory,
  "var",
  "cache",
  "setup"
);
let esyBashExePath = path.join(
  __dirname,
  "re",
  "_build",
  "default",
  "bin",
  "EsyBash.exe"
);

function log(...args) {
  console.log("[esy-bash-setup]", ...args);
}

async function downloadSetup() {
  const downloadFolder = __dirname;
  const cygSetupPath = path.join(__dirname, cygwinSetup);

  if (await fs.exists(cygSetupPath)) {
    log(`Found setup installer at ${cygSetupPath}`);
  } else {
    log(
      `Downloading setup from: ${cygwinSetupDownloadURL} to: ${downloadFolder}`
    );
    await download(cygwinSetupDownloadURL, downloadFolder);
    log(`Download complete!`);
  }

  return cygSetupPath;
}

function runCommand(cmd, args) {
  log(`Running command: ${[cmd, ...args].join(" ")}`);
  return cp.spawnSync(cmd, args, {
    stdio: [process.stdin, process.stdout, process.stderr],
    encoding: "utf-8",
  });
}

async function runSetup(args) {
  // downloadSetup() is, in a manner of speaking, memoised. Downloads only if the not downloaded already
  let cygSetupPath = await downloadSetup();
  return runCommand(cygSetupPath, args);
}

async function downloadPackages() {
  log(`Downloading packages...`);
  await runSetup([
    "-qWnNdOD",
    "-R",
    installationDirectory,
    "-s",
    cygMirror,
    "-l",
    localPackageDirectory,
    "-P",
    packagesToInstall.join(","),
  ]);
  log(`Download complete!`);
}

async function installPackages() {
  log(`Installation packages...`);
  await runSetup([
    "-qWnNdO",
    "-R",
    installationDirectory,
    "-L",
    "-l",
    localPackageDirectory,
    "-P",
    packagesToInstall.join(","),
  ]);

  log(`Installation complete!`);

  // Delete the /var/cache folder, since it's large and we don't need the cache at this point
  log("Deleting /var/cache...");
  await fs.remove(path.join(__dirname, ".cygwin", "var", "cache"));
  log("Deletion successful!");

  // Copy any overridden configuration scripts to the cygwin folder
  log("Copying over defaults...");
  fs.copySync(
    path.join(__dirname, "defaults"),
    path.join(__dirname, ".cygwin")
  );
  log("Defaults copied successfully");

  // Explicitly set home directory
  try {
    fs.appendFileSync(
      path.join(__dirname, ".cygwin", "etc", "nsswitch.conf"),
      "\ndb_home: /usr/esy\n"
    );
  } catch (e) {
    console.error("Something went wrong while updating nsswitch.conf");
  }

  // Run a command to test it out & create initial script files
  let esyBashArgs = ["bash", "-lc", "cd ~ && pwd"];
  let { pid, error, status, stdout, stderr } = cp.spawnSync(
    esyBashExePath,
    esyBashArgs
  );

  if (status !== 0 || error) {
    console.error("Error occured while running EsyBash.exe");
    if (error) {
      if (error.errno === -4058) {
        console.error(`${esyBashExePath} doesn't exist`);
      } else {
        console.error("error", error.message);
        console.error(error);
      }
    }
    log("EsyBash args", esyBashArgs);
    log("PID", pid);
    log("stdout", stdout.toString());
    log("stderr", stderr.toString());
    return -1;
  }
  log("Verifying esy profile set up...");
  const bashRcContents = fs
    .readFileSync(path.join(__dirname, ".cygwin", "usr", "esy", ".bashrc"))
    .toString("utf8");
  log("Esy user profile setup!");
}

module.exports = { downloadPackages, installPackages };
