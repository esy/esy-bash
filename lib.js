const os = require("os");
const path = require("path");
const download = require("download");
const cp = require("child_process");
const fs = require("fs-extra");
const packagesToInstall = require("./packages-to-install");
const tar = require("tar");
const { log } = require("./utils");
const {
  cygMirror,
  cygwinSetup,
  cygwinSetupDownloadURL,
  installationDirectory,
  esyBashExePath,
} = require("./paths.js");
const windowsDefaultManifest = require("./windows-default-manifest");

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

function runCommand(cmd, args, options) {
  let commandString = [cmd, ...args].join(" ");
  log(`Running command: ${commandString}`);
  let { pid, error, status, stdout, stderr } = cp.spawnSync(cmd, args, {
    stdio: [process.stdin, process.stdout, process.stderr],
    encoding: "utf-8",
    ...options,
  });
  if (status !== 0 || error) {
    console.error(`Error occured while running ${commandString}`);
    if (error) {
      if (error.errno === -4058) {
        console.error(`${cmd} doesn't exist`);
      } else {
        console.error("error", error.message);
        console.error(error);
      }
    }
    log("Command", cmd);
    log("Command args", args);
    log("PID", pid);
    log("stdout", stdout && stdout.toString());
    log("stderr", stderr && stderr.toString());
    process.exit(-1);
  }
}

async function runSetup(args) {
  // downloadSetup() is, in a manner of speaking, memoised. Downloads only if the not downloaded already
  let cygSetupPath = await downloadSetup();
  return runCommand(cygSetupPath, args);
}

function runEsyBash(args, options) {
  return runCommand(esyBashExePath, args, options);
}

async function downloadPackages(localPackageDirectory) {
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

async function installPackages(localPackageDirectory) {
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
  runEsyBash(esyBashArgs);

  log("Verifying esy profile set up...");
  const bashRcContents = fs
    .readFileSync(path.join(__dirname, ".cygwin", "usr", "esy", ".bashrc"))
    .toString("utf8");
  log("Esy user profile setup!");
}

async function downloadWindowsDefaultManifest(downloadFolder) {
  let { tarballName, tarballURL } = windowsDefaultManifest;
  await download(tarballURL, downloadFolder);
  let tarballPath = path.join(downloadFolder, tarballName);
  return tarballPath;
}

async function installWindowsDefaultManifest(localPackageDirectory) {
  let { tarballName } = windowsDefaultManifest;
  let tarballPath = path.join(localPackageDirectory, tarballName);
  await tar.x({
    gzip: true,
    C: localPackageDirectory,
    file: tarballPath,
  });
  let extractedPath = tarballPath.replace(".tar.gz", "");
  runEsyBash(
    `./configure --host x86_64-w64-mingw32 --prefix=/usr/x86_64-w64-mingw32/sys-root/mingw`.split(
      " "
    ),
    {
      cwd: extractedPath,
    }
  );
  runEsyBash(`make`.split(" "), { cwd: extractedPath });
  runEsyBash(`make install`.split(" "), { cwd: extractedPath });
}

module.exports = {
  downloadPackages,
  installPackages,
  downloadWindowsDefaultManifest,
  installWindowsDefaultManifest,
};
