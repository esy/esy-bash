const os = require("os")

if (os.platform() === "win32") {
    console.log("TODO: Install Cygwin)
} else {
    console.log("Not Windows; Cygwin is not required.")
}
