const fs = require("fs");

class PackageJson {
  constructor(path) {
    this.path = path;
    this.json = require(path);
  }
  read() {
    return this.json;
  }
  write(key, value) {
    this.json = Object.assign({}, this.json, { [key]: value });
    fs.writeFileSync(this.path, JSON.stringify(this.json, null, 2));
  }
  get name() {
    return this.json.name;
  }
  get version() {
    return this.json.version;
  }
}

module.exports = PackageJson;
