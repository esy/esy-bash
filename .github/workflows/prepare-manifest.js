const PackageJson = require("./lib/package-json");

module.exports = exports = (packageJsonPath) => {
  let packageJson = new PackageJson(packageJsonPath);
  let { GITHUB_REF_TYPE, GITHUB_SHA, GITHUB_REF, GITHUB_REF_NAME } =
    process.env;
  let version;
  if (GITHUB_REF_TYPE == "tag") {
    version = GITHUB_REF_NAME;
  } else {
    version = `0.1.0-dev-${GITHUB_SHA}`;
    // We dont care about
    // semver. Dev version have
    // to be installed with explicit
    // tags
  }
  packageJson.write("version", version);
};
