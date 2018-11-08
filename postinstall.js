
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

console.log("Restoring hardlinks...");
restoreLinks();
console.log("Complete!");

process.on('unhandledRejection', (err) => {
    console.log("unhandledRejection", err.message);
    process.exit(1);
})
