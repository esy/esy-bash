const cp = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { ESY_BASH_PACKAGE_NAME } = require("../package-name");

const normalizePath = (str) => {
  return str.split("\\").join("/");
};

const binPath = path.join(
  path.dirname(require.resolve(`${ESY_BASH_PACKAGE_NAME}/package.json`)),
  "re",
  "_build",
  "default",
  "bin",
  "EsyBash.exe"
);

let idx = 0;
const getTempDirectory = () => {
  idx++;
  const testDirectoryName =
    "test directory " + idx.toString() + "__" + new Date().getTime().toString();
  return path.join(os.tmpdir(), testDirectoryName);
};

const esyBashRun = async (script, envFilePath, cwd) => {
  cwd = cwd || process.cwd();
  const args = envFilePath ? ["--env", envFilePath, script] : [script];

  const output = cp.spawnSync(binPath, args, {
    cwd,
  });

  return {
    status: output.status,
    stdout: output.stdout.toString("utf8"),
    stderr: output.stderr.toString("utf8"),
  };
};

const toCygwinPath = async (originalPath) => {
  const normalizedPath = normalizePath(originalPath);
  const ret = await esyBashRun(`cygpath "${normalizedPath}"`);
  let val = ret.stdout.toString("utf8");
  return val ? val.trim() : null;
};

const description = `Testing with: ${binPath}`;

describe(description, () => {
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

  describe("--env: environment file", async () => {
    it("loads an environment variable from environment file", async () => {
      const environmentFilePath = path.join(os.tmpdir(), "env-file");
      const environment = JSON.stringify({
        SOME_ENVIRONMENT_VARIABLE: "test-variable-value",
        "": "",
      });
      fs.writeFileSync(environmentFilePath, environment);

      const output = await esyBashRun(
        "echo $SOME_ENVIRONMENT_VARIABLE",
        environmentFilePath
      );

      expect(output.stderr.toString()).toBe("");
      expect(output.status).toEqual(0);
      expect(
        output.stdout.indexOf("test-variable-value")
      ).toBeGreaterThanOrEqual(0);
    });

    it("loads PATH correctly from environment file", async () => {
      const environmentFilePath = path.join(os.tmpdir(), "env-file");
      const environment = JSON.stringify({
        PATH: "C:\\Users\\bryph\\.esy\\3_/i/opam__slash__jbuilder-1.0.0-beta20-6990b2ff/bin;C:\\Users\\bryph\\.esy\\3_/i/ocaml-4.6.4-092f4a41/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__esy_installer-0.0.0-821110a6/bin;C:\\Users\\bryph\\.esy\\3_/i/esy_ocaml__slash__substs-0.0.1-49144bdf/bin;C:\\hello-world",
      });
      fs.writeFileSync(environmentFilePath, environment);

      const output = await esyBashRun("echo $PATH", environmentFilePath);
      expect(output.status).toEqual(0);
      expect(output.stdout.indexOf("hello-world")).toBeGreaterThanOrEqual(0);
    });
  });

  describe("arguments", () => {
    it("respects arguments passed in", async () => {
      const result = cp.spawnSync(binPath, [
        "sh",
        "-c",
        "(echo Hello || true)",
      ]);

      expect(result.status).toEqual(0);
      expect(result.stdout.indexOf("Hello")).toBeGreaterThanOrEqual(0);
    });
  });

  describe("symlinks", () => {
    it("create and read from symlink", async () => {
      const tempDirectoryPath = getTempDirectory();
      fs.mkdirSync(tempDirectoryPath);

      const sourceFilePath = path.join(tempDirectoryPath, "src.txt");
      const destFilePath = path.join(tempDirectoryPath, "dest.txt");

      fs.writeFileSync(sourceFilePath, "test file", "utf8");

      let src = await toCygwinPath(sourceFilePath);
      let dest = await await toCygwinPath(destFilePath);

      const output = await esyBashRun(`ln -s "${src}" "${dest}"`);

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

      let src = await toCygwinPath(destDirectory);
      output = await esyBashRun(
        `tar -xf test.tgz -C "${src}"`,
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
