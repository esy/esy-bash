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

const remapPathsInEnvironment = (env) => {
    const val = Object.keys(env).reduce((prev, cur) => {
        // Normalize PATH variable
        cur = cur.toLowerCase() === "path" ? "PATH" : cur
        let mappedVariable = cur === "PATH" ? normalizePath(env[cur]): normalizePath(env[cur])
        return {
            ...prev,
            [cur]: mappedVariable,
        }
    }, {})
    return val
}

const bashExec = (bashCommand, options) => {
    options = options || {}
    nonce++

    const cwd = options.cwd || process.cwd()


    const sanitizedCommand = bashCommand.split("\\").join("/")
    console.log("esy-bash: executing bash command: " + sanitizedCommand + ` | nonce: ${nonce}`)

    let env = process.env

    if (options.environmentFile) {
        console.log(" -- using environment file: " + options.environmentFile)

        const envFromFile = JSON.parse(fs.readFileSync(options.environmentFile))
        const remappedPaths = remapPathsInEnvironment(envFromFile)

        env = {
            ...env,
            ...remappedPaths,
        }

        env["path"] = env["Path"] = remappedPaths["PATH"]
    }

    const bashCommandWithDirectoryPreamble = `
        cd ${normalizePath(cwd)}
        ${sanitizedCommand}
    `
    const command = normalizeEndlines(bashCommandWithDirectoryPreamble)

    const tmp = os.tmpdir()
    const temporaryScriptFilePath = path.join(tmp, `__esy-bash__${new Date().getTime()}__${nonce}__.sh`)

    fs.writeFileSync(temporaryScriptFilePath, bashCommandWithDirectoryPreamble, "utf8")
    let normalizedPath = normalizePath(temporaryScriptFilePath)
    console.log(" -- script file: " + normalizedPath)

    let proc = null

    const opts = {
        env,
    }

    if (os.platform() === "win32") {
        proc = cygwinExec(normalizedPath, opts)
    } else {
        // Add executable permission to script file
        fs.chmodSync(temporaryScriptFilePath, "755")
        proc = nativeBashExec(normalizedPath, opts)
    }

    return new Promise((res, rej) => {
        proc.on("close", (code) => {
            console.log("esy-bash: process exited with code " + code)
            res(code)
        })
    })
}

const nativeBashExec = (bashCommandFilePath, opts) => {
    return cp.spawn("bash", ["-c", bashCommandFilePath], {
        stdio: "inherit",
        ...opts,
    })
}

const toCygwinPath = (originalPath) => {
    if (os.platform() !== "win32") {
        return originalPath
    }

    const normalizedPath = normalizePath(originalPath)

    const ret = cp.spawnSync(bashPath, ["-lc", `cygpath ${normalizedPath}`])
    let val = ret.stdout.toString("utf8")
    return val ? val.trim() : null
}

const cygwinExec = (bashCommandFilePath, opts) => {

    // Create a temporary shell script to run the command,
    // since the process doesn't respect `cwd`.

    const bashArguments = bashCommandFilePath ? "-lc" : "-l"

    return cp.spawn(bashPath, [bashArguments, ". " + bashCommandFilePath], {
        stdio: "inherit",
        ...opts,
    })
}

module.exports = {
    bashExec,
    toCygwinPath,
}

