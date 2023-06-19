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
    let output = cp.execSync(`fsutil hardlink list "${filePath}"`).toString().trim();

    let lines = output.split(os.EOL).map(p => convertCygwinPathToRelativePath(path.dirname(p), path.basename(p)));
    return lines;
};

const cygwinPath = path.join(__dirname, "..", ".cygwin");
const bashCommand = path.join(cygwinPath, "bin", "bash.exe");
const bashExec = (command) => {
    let output = cp.execSync(`${bashCommand} -lc '${command}'`);
    return output.toString().trim();
};

const cygPath = (p) => {
    p = p.split("\\").join("/")
    let ret = bashExec(`cygpath -u "${p}"`);
    return ret;
};

const extensionsToIgnore = [
    ".exe",
    ".dll",
    ".sh",
    ".h",
    ".hpp",
    ".db",
    ".gz",
    ".c",
    ".a"
];

const isSymlink = (filePath) => {
    // Speed up check by only looking for symlinks with a whitelisted extension
    let shouldIgnore = extensionsToIgnore.reduce((prev, curr) => prev || filePath.endsWith(curr), false);
    if (shouldIgnore) {
        return false;
    }

    // HACK: Skip non-ssl and non-etc paths to speed this up...
    if (filePath.indexOf("ssl") === -1 && filePath.indexOf("etc") === -1 && filePath.indexOf("bin") === -1) {
        return false;
    }

    console.log("Checking symlink: " + filePath);
    let isSymlink = true;
    try {
       let ret = bashExec(`test -L "${cygPath(filePath)}"`);
       console.log("SYMLINK! " + filePath);
    } catch (ex) {
        isSymlink = false;
    }

    return isSymlink;
};

// Helper method to get the symlink contents from a cygwin symlink file
const extractSymlinkFromPath = (filePath) => {
    let result = bashExec(`readlink "${cygPath(filePath)}"`)

    return result.trim();
};

const getAllHardLinks = async (folder, curr) => {
    console.log("-checking: " + folder);

    let stats;
    try {
        stats = fs.lstatSync(folder);
    } catch (e) {
	if (e.errno === -4092) {
	    // EACCES
	    try {
		let cygwinCompatiblePath = cygPath(folder);
		bashExec(`chmod u+rwx ${cygwinCompatiblePath}`);
		stats = fs.lstatSync(folder);
	    } catch (e) {
		console.log("Failed to chmod. Reason", e.message);
		console.log("Full error", e);
                console.log("Not going to look for hardlinks of path", folder);
	        return;
	    }
	} else {
	    console.log("Failed to lstatsync", folder);
	    console.log("Full error", e);
            console.log("Not going to look for hardlinks of path", folder);
	    return;
	}
    }

    if (stats.isDirectory()) {
       const dirs = fs.readdirSync(folder); 
       dirs.forEach((d) => getAllHardLinks(path.join(folder, d), curr));
    } else {
        const hardLinks = getHardLinksForFile(folder);
        if(hardLinks.length > 1) { 
            console.log(" -- found hardlink: " + folder);
            curr.hardlinks[hardLinks[0]] = hardLinks;
        } else if(isSymlink(folder)) {
            let relativePath = convertCygwinPathToRelativePath(path.dirname(folder), path.basename(folder))
            console.log(" -- found symlink: " + relativePath);
            curr.symlinks["/" + relativePath] = extractSymlinkFromPath(folder);
        }
    }
};

const generateLinksJson = (p) => {
    let ret = {
        hardlinks: {},
        symlinks: {},
    };
    getAllHardLinks(p, ret);
    fs.writeFileSync(path.join(p, "links.json"), JSON.stringify(ret));
};

module.exports = {
    generateLinksJson
};
