const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const promisify = require("util").promisify;

const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const linkAsync = promisify(fs.link);
const unlinkAsync = promisify(fs.unlink);
const copyFileAsync = promisify(fs.copyFile);

const spawnAsync = (command, args, options) => {
    return new Promise((resolve, reject) => {
        let proc = cp.spawn(command, args, options);

        let data = "";
        proc.stdout.on("data", (d) => {
            data += d;
        })

        proc.on("close", (exitCode) => {
            if (exitCode === 0) {
                resolve(data);
            } else {
                reject();
            }
        });
    });
};


const toCygwinPathAsync = async (p) => {
    p = p.split("\\").join("/")
    let ret = await spawnAsync(path.join(rootFolder, "re", "_build", "default", "bin", "EsyBash.exe"), ["bash", "-lc", `cygpath ${p}`]);
    return ret.trim();
}

const rootFolder = path.join(__dirname, "..");
const cygwinFolder = path.join(__dirname, "..", ".cygwin");
const linksFolder = path.join(cygwinFolder, "_links");

const getNameForKey = (key) => {
    return key.trim().split("/").join("_s_");
}

const readLinks = () => {
    const linkInfo = fs.readFileSync(path.join(cygwinFolder, "links.json")).toString("utf8");
    return JSON.parse(linkInfo);
}

const consolidateLinks = async () => {
    // Take the links as input, and:
    // 1) Move the executables to a 'links' folder
    // 2) Delete all linked references

    const linksFolderExists = await existsAsync(linksFolder);
    if (!linksFolderExists) {
        await mkdirAsync(linksFolder);
    }

    const deleteFile = async (file) => {
        const fileToDelete = path.join(cygwinFolder, path.normalize(file.trim()));
        console.log(`Deleting: ${fileToDelete}`);

        const fileExists = await existsAsync(fileToDelete);
        if (!fileExists) {
            console.warn("- Not present: " + fileToDelete);
        } else {
            await unlinkAsync(fileToDelete);
        }
    }

    const allLinks = readLinks();
    const links = allLinks.hardlinks;
    // Consolidate hard links
    let outerPromises = Object.keys(links).map(async (key) => {
        const l = links[key];

        const src = path.join(cygwinFolder, path.normalize(key.trim()));
        const dst = path.join(cygwinFolder, "_links", getNameForKey(key));
        console.log("Source folder: " + src);
        console.log("Dest folder: " + dst);

        try {
            await copyFileAsync(src, dst);
        } catch (ex) {
            console.error(ex);
            exit(1);
        }

        let promises = l.map(async (file) => {
            await deleteFile(file);
        })

        await Promise.all(promises);
    });
    await Promise.all(outerPromises);
}

const ensureFolder = async (p) => {
    let exists = await existsAsync(p);
    if (exists) {
        return;
    }

    await ensureFolder(path.dirname(p));
    await mkdirAsync(p);
};

const checkUserFolder = async (p) => {
    const esyFolder = path.join(cygwinFolder, "usr", "esy");
    const bashRc = path.join(esyFolder, ".bash_profile");

    try {
    const folderExists = await existsAsync(esyFolder);
    const bashRcExists = await existsAsync(bashRc);

    console.log("/usr/esy folder exists: " + folderExists.toString());
    console.log("/usr/esy/.bashrc exists: " + bashRcExists.toString());
    } catch (ex) {
        console.warn("/usr/esy " + "folder not set up correctly!")
    }
};

const restoreLinks = async () => {
    // Take links as input, and:
    // Create hardlinks from the '_links' folder to all the relevant binaries

    const allLinks = readLinks();

    await checkUserFolder();

    // Hydrate hard links
    console.log("Hydrating hardlinks...");
    const links = allLinks.hardlinks;
    let outerPromises = Object.keys(links).map(async (key) => {
        const l = links[key];

        const src = path.join(cygwinFolder, "_links", getNameForKey(key));

       let promises = l.map(async (file) => {
            const dst = path.join(cygwinFolder, file.trim());
            await ensureFolder(path.dirname(dst));

           const exists = await existsAsync(dst);
            if (exists) {
                console.warn("Warning - file already exists: " + dst);
            } else {
                await linkAsync(src, dst);
            }
        })
        await Promise.all(promises);
    });
    await Promise.all(outerPromises);

    // Hydrate symlinks
    console.log("Hydrating symlinks...");
    const symlinks = allLinks.symlinks;
    outerPromises = Object.keys(symlinks).map(async (key) => {
        const link = path.join(cygwinFolder, key);

        let orig = symlinks[key];

        // If the key points to an absolute path, use that.
        // Otherwise, it's relative to the link, so append the path.
        if (orig[0] !== '/' && orig[0] !== '\\') { 
            orig = path.dirname(link) + "/" + orig;
        } else {
            orig = path.join(cygwinFolder, orig);
        }

        const origExists = await existsAsync(orig);
        if (!origExists) {
            console.warn("Cannot find original path: " + orig + ", skipping symlink: " + link);
            return;
        }

        const linkExists = await existsAsync(link);
        if (linkExists) {
            await unlinkAsync(link);
        }

        console.log(`Linking ${link} to ${orig}`)
        const cygLink = await toCygwinPathAsync(link);
        const cygOrig = await toCygwinPathAsync(orig);
        await checkUserFolder();
        await spawnAsync(path.join(rootFolder, "re", "_build", "default", "bin", "EsyBash.exe"), ["bash", "-lc", `ln -s ${cygOrig} ${cygLink}`]);
    });

    await Promise.all(outerPromises);
    console.log("Links restored.");
}

module.exports = {
    consolidateLinks,
    restoreLinks
};
