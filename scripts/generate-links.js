/**
 * Helper file to generate a `links.json` file,
 * which describes all the hard links that need to be handled
 * or rested
 */

const os = require("os")
const path = require("path")
const mkdirp = require("mkdirp")
const download = require("download")
const cp = require("child_process")
const rimraf = require("rimraf");
const fs = require("fs-extra");

const log = (msg) => console.log(msg)

const convertCygwinPathToRelativePath = (p, curr) => {
    const currentDirectory = p.split(path.sep).pop();
    if (currentDirectory === ".cygwin") {
        return curr;
    }

    return convertCygwinPathToRelativePath(path.dirname(p), currentDirectory + "/" + curr);
};

const getHardLinksForFile = (filePath) => {
    let output = cp.execSync("fsutil hardlink list " + filePath).toString().trim();

    let lines = output.split(os.EOL).map(p => convertCygwinPathToRelativePath(path.dirname(p), path.basename(p)));
    return lines;
};

const getAllHardLinks = async (folder, curr) => {
    console.log("-checking: " + folder);
    const stats = fs.statSync(folder);

    if (stats.isDirectory()) {
       const dirs = fs.readdirSync(folder); 
       dirs.forEach((d) => getAllHardLinks(path.join(folder, d), curr));
    } else {
        const hardLinks = getHardLinksForFile(folder);
        if(hardLinks.length > 1) { 
            console.log(" -- found hardlink!");
            curr[hardLinks[0]] = hardLinks;
        }
    }
};

const generateLinksJson = () => {
    let ret = {};
    getAllHardLinks("E:/esy-bash/.cygwin", ret);
    fs.writeFileSync(path.join(__dirname, "..", ".cygwin", "links.json"), JSON.stringify(ret));
};

module.exports = {
    generateLinksJson
};
