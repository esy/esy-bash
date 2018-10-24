
if (process.platform !== "win32") {
    console.log("No unpack needed");
    return 0;
}

const { restoreLinks } = require("./scripts/consolidate-links");

console.log("Restoring hardlinks...");
restoreLinks();
console.log("Complete!");
