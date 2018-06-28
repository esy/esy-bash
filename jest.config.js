const {defaults} = require("jest-config")
const os = require("os")

module.exports = {
    testPathIgnorePatterns: os.platform() === "win32" ? defaults.testPathIgnorePatterns : [...defaults.testPathIgnorePatterns, "/windows"],
    moduleFileExtensions: [...defaults.moduleFileExtensions, os.platform() + ".js"]
}
