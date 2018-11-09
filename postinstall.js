
if (process.platform !== "win32") {
    console.log("No unpack needed");
    return 0;
}

const fs = require("fs");
const path = require("path");
const { restoreLinks } = require("./scripts/consolidate-links");

if (!fs.existsSync(path.join(__dirname, ".cygwin"))) {
    console.warn("No cygwin folder found, not restoring links");
    return 0;
}

let restore = async () => {
    console.log("Restoring hardlinks...");
    await restoreLinks();
    console.log("Complete!");
};

restore();

process.on('unhandledRejection', (err) => {
    console.log("unhandledRejection", err);
    process.exit(1);
})
