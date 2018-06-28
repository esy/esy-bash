const os = require("os")
const path = require("path")
const mkdirp = require("mkdirp")
const download = require("download")
const cp = require("child_process")

const log = (msg) => console.log(msg)

const install = async () => {
    // Several of these constants are borrowed from:
    // https://github.com/ocaml/ocaml-ci-scripts/blob/master/appveyor-install.ps1

    const cygSetup = "setup-x86_64.exe"
    const cygDownloadPath = `https://cygwin.com/${cygSetup}`
    const cygMirror = "http://cygwin.mirror.constant.com"

    const packagesToInstall = [
        "mingw64-x86_64-gcc-core",
        "mingw64-x86_64-headers",
        "mingw64-x86_64-runtime",
        "mingw64-x86_64-winpthreads",
        "curl",
        "diff",
        "diffutils",
        "git",
        "m4",
        "make",
        "patch",
        "perl",
        "rsync",
        "unzip",
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

    log(`Setting up OPAM...`)
    const bashExecutablePath = path.join(destinationFolder, "bin", "bash.exe")
    const opamScriptPath = path.resolve(path.join(__dirname, "install-opam.sh"))

    cp.spawnSync(bashExecutablePath, [
        "-l",
        opamScriptPath,
    ], {
        stdio: "inherit",
        encoding: "utf-8",
        env: {
            ...process.env
        }
    })

    log(`OPAM setup complete`)
}

if (os.platform() === "win32") {
    install()
} else {
    console.log("Not Windows; Cygwin is not required.")
}
