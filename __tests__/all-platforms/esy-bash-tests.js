const cp = require("child_process")
const os = require("os")
const fs = require("fs")
const path = require("path")

const { bashExec, toCygwinPath } = require("./../../index")

const bashPath = path.join(__dirname, "..", "..", "bin", "esy-bash.js")

const binPath = path.join(__dirname, "..", "..", "re", "_build", "default", "bin", "EsyBash.exe");

const esyBashRun = async (script, envFilePath) => {
    console.log("BIN PATH: " + binPath);
    console.log(`esy-bash: ${script}`)

    const args = envFilePath ? ["--env", envFilePath, script] : [script]

    const output = cp.spawnSync(binPath, args)
    console.log(` - command returned with status: ${output.status}`)

    console.log(` stdout: ${output.stdout}`)
    console.log(` stderr: ${output.stderr}`)

    return {
        status: output.status,
        stdout: output.stdout.toString("utf8"),
        stderr: output.stderr.toString("utf8"),
    }
}

const getTempDirectory = () => {
    const testDirectoryName = "test-directory-" + new Date().getTime().toString()
    return path.join(os.tmpdir(), testDirectoryName)
}

it("can pass basic statement to bash", async () => {
    const output = await esyBashRun('echo Hello World')

    expect(output.status).toBe(0)
    expect(output.stdout.indexOf("Hello World")).toBeGreaterThanOrEqual(0)
})

it("doesn't escape", async () => {
    const output = await esyBashRun('echo "Hello\nworld"')
    expect(output.status).toBe(0)
    expect(output.stdout).toEqual("Hello" + "\n" + "world" + "\n")
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
})

describe("cwd parameter", () => {
    it("respects the cwd parameter", async () => {
        const testDirectoryPath = getTempDirectory()
        fs.mkdirSync(testDirectoryPath)

        await bashExec("touch testfile", { cwd: testDirectoryPath })

        const doesFileExist = fs.existsSync(path.join(testDirectoryPath, "testfile"))

        expect(doesFileExist).toBe(true)
    })
})

describe("arguments", () => {
    it("respects arguments passed in", async () => {

        const result = cp.spawnSync(binPath, ["sh", "-c", "(echo Hello || true)"])

        expect(result.status).toEqual(0)
        expect(result.stdout.indexOf("Hello")).toBeGreaterThanOrEqual(0)

    })
})

describe("symlinks", () => {
    it("create and read from symlink", async () => {
        const tempDirectoryPath = getTempDirectory()
        fs.mkdirSync(tempDirectoryPath)

        console.log(tempDirectoryPath)

        const sourceFilePath = path.join(tempDirectoryPath, "src.txt")
        const destFilePath = path.join(tempDirectoryPath, "dest.txt")

        fs.writeFileSync(sourceFilePath, "test file", "utf8")

        const output = await esyBashRun(`ln -s ${toCygwinPath(sourceFilePath)} ${toCygwinPath(destFilePath)}`)

        expect(output.status).toEqual(0)
        expect(fs.existsSync(destFilePath)).toBeTruthy()

        const destFileContents = fs.readFileSync(destFilePath).toString("utf8")
        expect(destFileContents).toEqual("test file")
    })
})
