const cp = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const bashPath = path.join(__dirname, ".cygwin", "bin", "bash.exe")

const normalizeEndlines = (str) => str.split("\r\n").join("\n")

const normalizePath = (str) => {
    return str.split("\\").join("/")
}

let nonce = 0

const bashExec = (bashCommand, options) => {
    options = options || {}
    nonce++
    console.log("esy-bash: executing bash command: " + bashCommand + `nonce: ${nonce}`)

    const bashCommandWithDirectoryPreamble = `
        cd ${normalizePath(process.cwd())}
        ${bashCommand}
    `
    const command = normalizeEndlines(bashCommandWithDirectoryPreamble)

    const tmp = os.tmpdir()
    const temporaryScriptFilePath = path.join(tmp, `__esy-bash__${new Date().getTime()}__${nonce}__.sh`)

    fs.writeFileSync(temporaryScriptFilePath, bashCommandWithDirectoryPreamble, "utf8")
    let normalizedPath = normalizePath(temporaryScriptFilePath)

    let proc = null

    if (os.platform() === "win32") {
        proc = cygwinExec(normalizedPath, options)
    } else {
        proc = nativeBashExec(normalizedPath, options)
    }

    return new Promise((res, rej) => {
        proc.on("close", (code) => {
            console.log("esy-bash: process exited with code " + code)
            res(code)
        })
    })
}

const nativeBashExec = (bashCommandFilePath, options) => {
    return cp.spawn("bash", ["-c", bashCommandFilePath], {
        stdio: "inherit",
        cwd: process.cwd(),
        ...options,
    })
}


const cygwinExec = (bashCommandFilePath, options) => {

    // Create a temporary shell script to run the command,
    // since the process doesn't respect `cwd`.

    const bashArguments = bashCommandFilePath ? "-lc" : "-l"

    return cp.spawn(bashPath, [bashArguments, bashCommandFilePath], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
            ...process.env,
            "HOME": "/home/esyuser",
        },
        ...options,
    })
}

module.exports = {
    bashExec,
}

