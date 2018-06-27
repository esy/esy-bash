const {defaults} = require("jest-config")
const os = require("os")

module.exports = {
    moduleFileExtensions: [...defaults.moduleFileExtensions, os.platform() + ".js"]
}
