if (process.platform !== "win32") {
    console.log("No unpack needed");
    return 0;
}

const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { restoreLinks } = require("./scripts/consolidate-links");

const cygwinPath = path.join(__dirname, ".cygwin");
const cygwinBinPath = path.join(__dirname, ".cygwin", "bin");

if (!fs.existsSync(path.join(__dirname, ".cygwin"))) {
    // This is necessary because on the CI (or during local
    // development, runnning `npm install` will trigger postinstall
    // too. We dont want this to fail, esp on CI where it will break
    // the pipeline unnecessarily. The point of this `npm install`
    // command was only to setup dependencies needs to work with
    // esy-bash. A working postinstall at this stage (beginning of
    // development) isn't necessary.
    console.warn("No cygwin folder found, not restoring links");
    return 0;
}

let runPostCommand = (command, args, opts) => {
    opts = opts || {};
    let ret = cp.spawnSync(command, args, opts);

    if (ret.error) {
        throw(ret.error);
    } else if (ret.status !== 0) {
        console.error("[ERROR] stdout: " + ret.stdout.toString("utf8") + "\nstderr: " + ret.stderr.toString("utf8") + "\n");
        throw("Operation failed: " + command);
    }
};

let restore = async () => {
    console.log("Restoring hardlinks...");
    await restoreLinks();

    // Without rebasing, we'll hit errors like:
    // [main] make 10588 child_info_fork::abort: <some path>cygwin\bin\cygiconv-2.dll: Loaded to different address: parent(0x3FF530000) != child(0xDF0000)
    // Usually, the cygwin setup.exe takes care of setting up the dll rebasing - but since we're not running it on the host,
    // we need to force a rebase.

    console.log("Starting dll rebase...");
    runPostCommand(path.join(cygwinBinPath, "bash.exe"), ["-lc", "/usr/bin/rebase-trigger fullrebase"]);
    runPostCommand(path.join(cygwinBinPath, "dash.exe"), ["/etc/postinstall/0p_000_autorebase.dash"]);
    runPostCommand(path.join(cygwinBinPath, "dash.exe"), ["/etc/postinstall/0p_update-info-dir.dash"], {
        env: {
            PATH: "/usr/bin"
        }
    });
    console.log("Rebase complete.");
    console.log("Complete!");
};

restore();

process.on('unhandledRejection', (err) => {
    console.log("unhandledRejection", err);
    process.exit(1);
})
