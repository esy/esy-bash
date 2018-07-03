const cp = require("child_process")
const os = require("os")
const fs = require("fs")
const path = require("path")

const esyBashRun = async (script, envFilePath) => {
    console.log(`esy-bash: ${script}`)

    const bashPath = path.join(__dirname, "..", "..", "bin", "esy-bash.js")

    const args = env ? [bashPath, "--env", envFilePath, script] : [bashPath, script]

    const output = cp.spawnSync("node", args)
    console.log(` - command returned with status: ${output.status}`)

    console.log(` stdout: ${output.stdout}`)
    console.log(` stderr: ${output.stderr}`)

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

it("forwards exit code", async () => {
    const output = await esyBashRun('exit 1')
    expect(output.status).toBe(1)
})

describe("--env: environment file", async () => {
    it("loads an environment variable from environment file", async () => {
        const environmentFilePath = path.join(os.tmpdir(), "env-file")
        const environment = JSON.stringify({
            "SOME_ENVIRONMENT_VARIABLE": "test-variable-value"
        })

        const output = await esyBashRun("echo $SOME_ENVIRONMENT_VARIABLE", environmentFilePath)

        expect(output.stdout.indexOf("test-variable-value").toBeGreaterThanOrEqual(0))
    })
})
