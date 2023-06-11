if (process.platform !== "win32") {
    console.log("No unpack needed");
    return 0;
}

const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const cygwinPath = path.join(__dirname, ".cygwin");
const cygwinBinPath = path.join(__dirname, ".cygwin", "bin");

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

let main = async () => {

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

main();

process.on('unhandledRejection', (err) => {
    console.log("unhandledRejection", err);
    process.exit(1);
})
