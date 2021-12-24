const cp = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

const { bashExec, toCygwinPath } = require("./../index");

const bashPath = path.join(__dirname, "..", "bin", "esy-bash.js");
const binPath = path.join(
  __dirname,
  "..",
  "re",
  "_build",
  "default",
  "bin",
  "EsyBash.exe"
);

let invocations = [
  { tool: "node", args: [bashPath] },
  { tool: binPath, args: [] },
];

let idx = 0;
const getTempDirectory = () => {
  idx++;
  const testDirectoryName =
    "test directory " + idx.toString() + "__" + new Date().getTime().toString();
  return path.join(os.tmpdir(), testDirectoryName);
};

invocations.forEach((invocation) => {
  const description = `Testing with: ${invocation.tool} ${invocation.args.join(
    " "
  )}`;
  describe(description, () => {
    const esyBashRun = async (script, envFilePath, cwd) => {
      // console.log("BIN PATH: " + binPath);
      // console.log(`esy-bash: ${script}`)

      cwd = cwd || process.cwd();
      const args = envFilePath ? ["--env", envFilePath, script] : [script];

      // console.log("Using cwd: " + cwd);
      const output = cp.spawnSync(
        invocation.tool,
        [...invocation.args, ...args],
        { cwd }
      );
      // console.log(` - command returned with status: ${output.status}`)

      // console.log(` stdout: ${output.stdout}`)
      // console.log(` stderr: ${output.stderr}`)

      return {
        status: output.status,
        stdout: output.stdout.toString("utf8"),
        stderr: output.stderr.toString("utf8"),
      };
    };

    it("can pass basic statement to bash", async () => {
      const output = await esyBashRun("echo Hello World");

      expect(output.status).toBe(0);
      expect(output.stdout.indexOf("Hello World")).toBeGreaterThanOrEqual(0);
    });

    it("doesn't escape", async () => {
      const output = await esyBashRun('echo "Hello\nworld"');
      expect(output.status).toBe(0);
      expect(output.stdout).toEqual("Hello" + "\n" + "world" + "\n");
    });

    it("can pass output to bash", async () => {
      const output = await esyBashRun("echo $0");

      expect(output.status).toBe(0);
      expect(output.stdout.indexOf("bash")).toBeGreaterThanOrEqual(0);
    });

    it("forwards exit code", async () => {
      const output = await esyBashRun("exit 1");
      expect(output.status).toBe(1);
    });

    // describe("--env: environment file", async () => {
    //   it("loads an environment variable from environment file", async () => {
    //     const environmentFilePath = path.join(os.tmpdir(), "env-file");
    //     const environment = JSON.stringify({
    //       SOME_ENVIRONMENT_VARIABLE: "test-variable-value",
    //     });
    //     fs.writeFileSync(environmentFilePath, environment);

    //     const output = await esyBashRun(
    //       "echo $SOME_ENVIRONMENT_VARIABLE",
    //       environmentFilePath
    //     );

    //     expect(output.status).toEqual(0);
    //     expect(
    //       output.stdout.indexOf("test-variable-value")
    //     ).toBeGreaterThanOrEqual(0);
    //   });

    //   it("loads PATH correctly from environment file", async () => {
    //     const environmentFilePath = path.join(os.tmpdir(), "env-file");
    //     const environment = JSON.stringify({
    //       PATH:
    //         "C:\\Users\\bryph\\.esy\\3_/i/opam__slash__jbuilder-1.0.0-beta20-6990b2ff/bin;C:\\Users\\bryph\\.esy\\3_/i/ocaml-4.6.4-092f4a41/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__esy_installer-0.0.0-821110a6/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__substs-0.0.1-49144bdf/bin;C:\\hello-world",
    //     });
    //     fs.writeFileSync(environmentFilePath, environment);

    //     const output = await esyBashRun("echo $PATH", environmentFilePath);
    //     expect(output.status).toEqual(0);
    //     expect(output.stdout.indexOf("hello-world")).toBeGreaterThanOrEqual(0);
    //   });
    // });

    describe("cwd parameter", () => {
      it("respects the cwd parameter", async () => {
        const testDirectoryPath = getTempDirectory();
        fs.mkdirSync(testDirectoryPath);

        await bashExec("touch testfile", { cwd: testDirectoryPath });

        const doesFileExist = fs.existsSync(
          path.join(testDirectoryPath, "testfile")
        );

        expect(doesFileExist).toBe(true);
      });
    });

    describe("symlinks", () => {
      it("create and read from symlink", async () => {
        const tempDirectoryPath = getTempDirectory();
        fs.mkdirSync(tempDirectoryPath);

        console.log(tempDirectoryPath);

        const sourceFilePath = path.join(tempDirectoryPath, "src.txt");
        const destFilePath = path.join(tempDirectoryPath, "dest.txt");

        fs.writeFileSync(sourceFilePath, "test file", "utf8");

        const output = await esyBashRun(
          `ln -s "${toCygwinPath(sourceFilePath)}" "${toCygwinPath(
            destFilePath
          )}"`
        );

        expect(output.status).toEqual(0);
        expect(fs.existsSync(destFilePath)).toBeTruthy();

        const destFileContents = fs.readFileSync(destFilePath).toString("utf8");
        expect(destFileContents).toEqual("test file");
      });
    });

    describe("tar", () => {
      it("can create / unpack a tarball", async () => {
        const srcDirectory = getTempDirectory();
        fs.mkdirSync(srcDirectory);

        const testFile = path.join(srcDirectory, "test.txt");
        fs.writeFileSync(testFile, "hello world", "utf8");

        let output = await esyBashRun(
          `tar cvf test.tgz test.txt`,
          null,
          srcDirectory
        );
        console.dir(output);
        expect(output.status).toEqual(0);
        expect(fs.existsSync(path.join(srcDirectory, "test.tgz"))).toBe(true);

        const destDirectory = getTempDirectory();
        fs.mkdirSync(destDirectory);

        output = await esyBashRun(
          `tar -xf test.tgz -C "${toCygwinPath(destDirectory)}"`,
          null,
          srcDirectory
        );
        console.dir(output);
        expect(output.status).toEqual(0);
        expect(fs.existsSync(path.join(destDirectory, "test.txt"))).toBe(true);
      });
    });

    describe("awk", () => {
      it("can run awk", async () => {
        const output = await esyBashRun(`awk --version`);
        expect(output.status).toEqual(0);
      });
    });

    describe("git", () => {
      it("can run git w/ https", async () => {
        const output = await esyBashRun(
          `git ls-remote https://github.com/yarnpkg/example-yarn-package.git`
        );
        console.dir(output);
        expect(output.status).toEqual(0);
      });
    });
  });
});


describe("arguments", () => {
  it("respects arguments passed in", async () => {
    const result = cp.spawnSync(binPath, [
      "bash",
      "-c",
      "'(echo Hello || true)'",
    ]);
    expect(result.status).toEqual(0);
    expect(result.stdout.indexOf("Hello")).toBeGreaterThanOrEqual(0);
  });
});

