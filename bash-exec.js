const cp = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const bashPath = path.join(__dirname, ".cygwin", "bin", "bash.exe")

const normalizeEndlines = (str) => str.split("\r\n").join("\n")

const normalizePath = (str) => {
    return str.split("\\").join("/")
}

const bashExec = (bashCommand) => {
    console.log("esy-bash: executing bash command: " + bashCommand)

    const bashCommandWithDirectoryPreamble = `
        cd ${normalizePath(process.cwd())}
        ${bashCommand}
    `
    const command = normalizeEndlines(bashCommandWithDirectoryPreamble)

    const tmp = os.tmpdir()
    const temporaryScriptFilePath = path.join(tmp, "__test__.sh")

    fs.writeFileSync(temporaryScriptFilePath, bashCommandWithDirectoryPreamble, "utf8")
    let normalizedPath = normalizePath(temporaryScriptFilePath)

    let proc = null

    if (os.platform() === "win32") {
        proc = cygwinExec(normalizedPath)
    } else {
        proc = nativeBashExec(normalizedPath)
    }

    return new Promise.resolve((res, rej) => {
        proc.on("close", (code) => {
            console.log("esy-bash: process exited with code " + code)
            res(code)
        })
    })
}

const nativeBashExec = (bashCommandFile) => {
    return cp.spawn("bash", ["-c", bashCommandFile], {
        stdio: "inherit",
        cwd: process.cwd(),
    })
}


const cygwinExec = (bashCommandFile) => {

    // Create a temporary shell script to run the command,
    // since the process doesn't respect `cwd`.

    const bashArguments = bashCommand ? "-lc" : "-l"

    return cp.spawn(bashPath, [bashArguments, normalizePath(temporaryScriptFilePath)], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
            ...process.env,
            "HOME": "/home/esyuser",
        }
    })
}

module.exports = {
    bashExec,
}

