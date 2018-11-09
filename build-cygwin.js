const os = require("os")
const path = require("path")
const mkdirp = require("mkdirp")
const download = require("download")
const cp = require("child_process")
const rimraf = require("rimraf");
const fs = require("fs-extra");

const log = (msg) => console.log(msg)

const install = async () => {
    // Several of these constants are borrowed from:
    // https://github.com/ocaml/ocaml-ci-scripts/blob/master/appveyor-install.ps1

    const cygSetup = "setup-x86_64.exe"
    const cygDownloadPath = `https://cygwin.com/${cygSetup}`
    const cygMirror = "http://cygwin.mirror.constant.com"

    const packagesToInstall = [
        // Needed for cross-compilation to Windows native executables
        "mingw64-x86_64-gcc-core",
        "mingw64-x86_64-gcc-g++",
        "mingw64-x86_64-headers",
        "mingw64-x86_64-runtime",
        "mingw64-x86_64-winpthreads",

        // Linux utilities - 'bashisms' to support development
        "curl",
        "diff",
        "diffutils",
        "git",
        "m4",
        "make",
        "patch",
        "unzip",

        // Needed for installing the cygwin-build of OCaml
        // May not be needed
        // "gcc-g++",
        // "flexdll",
    ]

    const destinationFolder = path.join(__dirname, ".cygwin")
    const localPackageDirectory = path.join(destinationFolder, "var", "cache", "setup")
    const cygSetupPath = path.join(destinationFolder, cygSetup)

    log(`Creating folder: ${destinationFolder}`)
    mkdirp.sync(destinationFolder)

    log(`Downloading setup from: ${cygDownloadPath} to: ${destinationFolder}`)
    await download(cygDownloadPath, destinationFolder)
    log(`Download complete!`)

    log(`Installing packages...`)
    cp.spawnSync(cygSetupPath, [
        "-qWnNdO",
        "-R",
        destinationFolder,
        "-s",
        cygMirror,
        "-l",
        localPackageDirectory,
        "-P",
        packagesToInstall.join(",") 
    ], {
        stdio: [process.stdin, process.stdout, process.stderr],
        encoding: "utf-8",
    })

    log(`Installation complete!`)

    // Delete the /var/cache folder, since it's large and we don't need the cache at this point
    console.log("Deleting /var/cache...");
    rimraf.sync(path.join(__dirname, ".cygwin", "var", "cache"));
    console.log("Deletion successful!");

    // Copy any overridden configuration scripts to the cygwin folder
    console.log("Copying over defaults...");
    fs.copySync(path.join(__dirname, "defaults"), path.join(__dirname, ".cygwin"));
    console.log("Defaults copied successfully");

    // Explicitly set home directory
    try {
        fs.appendFileSync(
            path.join(__dirname, ".cygwin", "etc", "nsswitch.conf"),
            "\ndb_home: /usr/esy\n"
        );
    } catch(e) {
        console.error("Something went wrong while updating nsswitch.conf");
    }

    // Run a command to test it out & create initial script files
    cp.spawnSync(path.join(__dirname, "re", "_build", "default", "bin", "EsyBash.exe"), ["bash", "-lc", "cd ~ && pwd"]);
}

if (os.platform() === "win32") {
    install()
} else {
    console.log("Not Windows; Cygwin is not required.")
}
