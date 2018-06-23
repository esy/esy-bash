const cp = require("child_process")
const os = require("os")
const fs = require("fs")
const path = require("path")

const normalizeEndlines = (str) => str.split("\r\n").join("\n")

const normalizePath = (str) => str.split("\\").join("/")

const cygwinRun = async (script) => {

    console.log(`cygwinRun: ${script}`)

    const normalizedScript = normalizeEndlines(script)

    const tmp = os.tmpdir()
    const testFilePath = path.join(tmp, "__test__.sh")

    fs.writeFileSync(testFilePath, normalizedScript, "utf8")

    const bashPath = path.join(__dirname, ".cygwin", "bin", "bash.exe")

    const output = cp.spawnSync(bashPath, ["-lc", normalizePath(testFilePath)])
    console.log(` - command returned with status: ${output.status}`)

    return {
        status: output.status,
        stdout: output.stdout.toString("utf8"),
        stderr: output.stderr.toString("utf8"),
    }
}

it("can build a simple ocaml file", async () => {
    const script = 
        `echo print_endline 'Hello World'; > test.ml
         ocaml test.ml`

    const output = await cygwinRun(script)

    expect(output.status).toBe(0)
    expect(output.stdout.indexOf("Hello World")).toBeGreaterThanOrEqual(0)
})

it("ocamlc.opt.exe -config gives valid output", async () => {
    const script = `ocamlc.opt.exe -config`

    const output = await cygwinRun(script)

    expect(output.status).toBe(0)
    expect(output.stdout.indexOf("mingw32-gcc")).toBeGreaterThanOrEqual(0)

})

it("jbuilder installs", () => {

    const script = `opam install jbuilder`
    const output = await cygwinRun(script)

    expect(output.status).toBe(0)

    const jbuilderVersion = await cygwinRun("jbuilder --version")
    expect(jbuilderVersion.status).toBe(0)
})
