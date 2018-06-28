const cp = require("child_process")
const os = require("os")
const fs = require("fs")
const path = require("path")

const esyBashRun = async (script) => {
    console.log(`esy-bash: ${script}`)

    const bashPath = path.join(__dirname, "..", "..", "bin", "esy-bash.js")

    const output = cp.spawnSync("node", [bashPath, script])
    console.log(` - command returned with status: ${output.status}`)

    return {
        status: output.status,
        stdout: output.stdout.toString("utf8"),
        stderr: output.stderr.toString("utf8"),
    }
}

it("can pass basic statement to bash", async () => {
    const output = await esyBashRun('echo Hello World')

    expect(output.status).toBe(0)
    expect(output.stdout.indexOf("Hello World")).toBeGreaterThanOrEqual(0)
})

it("can pass output to bash", async () => {
    const output = await esyBashRun('echo $0')

    expect(output.status).toBe(0)
    expect(output.stdout.indexOf("bash")).toBeGreaterThanOrEqual(0)
})
