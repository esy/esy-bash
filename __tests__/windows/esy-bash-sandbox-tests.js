const cp = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const bashPath = path.join(__dirname, "..", "..", "bin", "esy-bash.js")

const esyBashRun = async (script, envFilePath) => {
    console.log(`esy-bash: ${script}`)

    const args = envFilePath ? [bashPath, "--env", envFilePath, script] : [bashPath, script]

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

it("test is only ran on windows", async () => {
    expect(os.platform()).toBe("win32")
})

describe("--env: environment file", () => {
    it("loads PATH correctly from environment file", async () => {
        const environmentFilePath = path.join(os.tmpdir(), "env-file")
        const environment = JSON.stringify({
            "PATH": "C:\\Users\\bryph\\.esy\\3_/i/opam__slash__jbuilder-1.0.0-beta20-6990b2ff/bin;C:\\Users\\bryph\\.esy\\3_/i/ocaml-4.6.4-092f4a41/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__esy_installer-0.0.0-821110a6/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__substs-0.0.1-49144bdf/bin;C:\\hello-world"
        })
        fs.writeFileSync(environmentFilePath, environment)

        const output = await esyBashRun("echo $PATH", environmentFilePath)
        expect(output.status).toEqual(0)
        expect(output.stdout.indexOf("hello-world")).toBeGreaterThanOrEqual(0)
    })
})
