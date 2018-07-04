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
        const mappedVariable = cur.toLowerCase() === "path" ? process.env["PATH"] + ";" + normalizePath(env[cur]) : normalizePath(env[cur])
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
    }

    const bashCommandWithDirectoryPreamble = `
        cd ${normalizePath(process.cwd())}
        ${sanitizedCommand}
    `
    const command = normalizeEndlines(bashCommandWithDirectoryPreamble)

    const tmp = os.tmpdir()
    const temporaryScriptFilePath = path.join(tmp, `__esy-bash__${new Date().getTime()}__${nonce}__.sh`)

    fs.writeFileSync(temporaryScriptFilePath, bashCommandWithDirectoryPreamble, "utf8")
    let normalizedPath = normalizePath(temporaryScriptFilePath)
    console.log(" -- script file: " + normalizedPath)

    let proc = null

    if (os.platform() === "win32") {
        proc = cygwinExec(normalizedPath, env)
    } else {
        // Add executable permission to script file
        fs.chmodSync(temporaryScriptFilePath, "755")
        proc = nativeBashExec(normalizedPath, env)
    }

    return new Promise((res, rej) => {
        proc.on("close", (code) => {
            console.log("esy-bash: process exited with code " + code)
            res(code)
        })
    })
}

const nativeBashExec = (bashCommandFilePath, env) => {
    return cp.spawn("bash", ["-c", bashCommandFilePath], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: env,
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

const cygwinExec = (bashCommandFilePath, env) => {

    // Create a temporary shell script to run the command,
    // since the process doesn't respect `cwd`.

    const bashArguments = bashCommandFilePath ? "-lc" : "-l"

    return cp.spawn(bashPath, [bashArguments, ". " + bashCommandFilePath], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: env,
    })
}

module.exports = {
    bashExec,
    toCygwinPath,
}

