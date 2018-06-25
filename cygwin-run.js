const cp = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const bashPath = path.join(__dirname, ".cygwin", "bin", "bash.exe")
const bashArguments = "-lc"

const normalizeEndlines = (str) => str.split("\r\n").join("\n")

const normalizePath = (str) => str.split("\\").join("/")

const runCygwin = (bashCommand) => {

    // Create a temporary shell script to run the command,
    // since the process doesn't respect `cwd`.

    const bashCommandWithDirectoryPreamble = `
        cd ${normalizePath(process.cwd())}
        ${bashCommand}
    `

    const command = normalizeEndlines(bashCommandWithDirectoryPreamble)

    const tmp = os.tmpdir()
    const temporaryScriptFilePath = path.join(tmp, "__test__.sh")

    fs.writeFileSync(temporaryScriptFilePath, bashCommandWithDirectoryPreamble, "utf8")

    const proc = cp.spawn(bashPath, [bashArguments, normalizePath(temporaryScriptFilePath)], {
        stdio: "inherit",
        cwd: process.cwd(),
    })
}

module.exports = {
    runCygwin,
}

