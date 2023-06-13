module.exports = exports = (core, packageJsonPath) =>
  core.setOutput("version", require(packageJsonPath).version);
