const cp = require("child_process")
const os = require("os")
const fs = require("fs")
const path = require("path")

const { bashExec } = require("./../../index")


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
        fs.writeFileSync(environmentFilePath, environment)

        const output = await esyBashRun("echo $SOME_ENVIRONMENT_VARIABLE", environmentFilePath)

        expect(output.status).toEqual(0)
        expect(output.stdout.indexOf("test-variable-value")).toBeGreaterThanOrEqual(0)
    })

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

describe("cwd parameter", () => {
    it("respects the cwd parameter", async () => {
        const testDirectoryName = "test-directory-" + new Date().getTime().toString()
        const testDirectoryPath = path.join(os.tmpdir(), testDirectoryName)
        fs.mkdirSync(testDirectoryPath)

        await bashExec("touch testfile", { cwd: testDirectoryPath })

        const doesFileExist = fs.existsSync(path.join(testDirectoryPath, "testfile"))

        expect(doesFileExist).toBe(true)
    })
})

describe("arguments", () => {
    it("respects arguments passed in", async () => {

        const result = cp.spawnSync("node", [bashPath, "sh", "-c", "(echo Hello || true)"])

        expect(result.status).toEqual(0)
        expect(result.stdout.indexOf("Hello")).toBeGreaterThanOrEqual(0)

    })
})
