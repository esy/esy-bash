////////////////////////////////////////////////////////////////////////////
// Because tar doesn't unpack hardlinks well.			          //
// 								          //
// tar: package/.cygwin/bin/dash.exe: Cannot hard link to                 //
// ‘.cygwin\\bin\\ash.exe’: No such file or directory   	          //
// tar: package/.cygwin/bin/gawk.exe: Cannot hard link to                 //
// ‘.cygwin\\bin\\gawk-5.2.2.exe’: No such file or directory   	          //
// tar: package/.cygwin/bin/git-upload-archive.exe: Cannot hard link to   //
// ‘.cygwin\\bin\\git-receive-pack.exe’: No such file or directory        //
// tar: package/.cygwin/bin/git-upload-pack.exe: Cannot hard link to      //
// ‘.cygwin\\bin\\git-receive-pack.exe’: No such file or directory        //
// tar: package/.cygwin/bin/git.exe: Cannot hard link to	          //
// ‘.cygwin\\bin\\git-receive-pack.exe’: No such file or directory        //
// tar: package/.cygwin/bin/ld.exe: Cannot hard link to		          //
// ‘.cygwin\\bin\\ld.bfd.exe’: No such file or directory 	          //
// tar: package/.cygwin/bin/perl5.36.1.exe: Cannot hard link to	          //
// ‘.cygwin\\bin\\perl.exe’: No such file or directory 		          //
// 								          //
// We record the hardlinks and symlinks to in links.json, delete and pack //
// them. Later, postinstall.js restores them back with the help of	  //
// links.json 								  //
// 								          //
////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const promisify = require("util").promisify;

const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);
const linkAsync = promisify(fs.link);
const unlinkAsync = promisify(fs.unlink);
const copyFileAsync = promisify(fs.copyFile);

const debugLog = (log) => {
    const isDebug = process.env["ESY_BASH_DEBUG"];

    if (isDebug) {
        console.log("[DEBUG] " + log);
    }
};

const spawnAsync = (command, args, options) => {
    return new Promise((resolve, reject) => {
        debugLog(`Running command: ${command} with args ${JSON.stringify(args)}`)
        let proc = cp.spawn(command, args, options);

        let data = "";
        let err = "";
        proc.stdout.on("data", (d) => {
            data += d;
        })

        proc.stderr.on("data", (e) => {
            err += e;
        });

        proc.on("close", (exitCode) => {
            if (exitCode === 0) {
                debugLog("Command was succesful.");
                resolve(data);
            } else {
                debugLog("Command failed with: " + err);
                reject(err);
            }
        });
    });
};


const toCygwinPathAsync = async (p, attempt) => {
    attemp = attempt || 0;
    p = p.split("\\").join("/")
    try {
        let ret = await spawnAsync(path.join(rootFolder, "re", "_build", "default", "bin", "EsyBash.exe"), ["bash", "-lc", `cygpath '${p}'`]);
        attempt = 0;
        return ret.trim();
    } catch(e) {
        if (/Resource temporarily unavailable/.test(e.message)) {
          console.log("A resource is temporarily unavailable");
	  console.log("Full error");
	  console.log(e);
	  if (attempt && attempt < 5) {
	    console.log(`Retrying in a second (attempt ${attempt}`);
	    return toCygwinPathAsync(p, attempt + 1);
	  } else {
	    console.log("Too many retries. Giving up");
	    console.log("Args", p);
	    throw e;
	  }
	} else {
	  throw e;
	}
    }
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

    // TODO: Don't use exists here.
    // These are moved to sync now until we fix this codepath - 
    // otherwise there is a race condition that hits an error.
    if (fs.existsSync(p)) {
        return;
    } else {
        fs.mkdirSync(p);
    }
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

const createSymlink = async (cygOrig, cygLink) => {
    // We'll use the real bash.exe instead of `EsyBash.exe` for this specific operation - restoring symlinks
    // These cymlinks were specifically 'cygwin-style' symlinks, and since we pass a `CYGWIN` environment
    // variable that overrides this in `EsyBash.exe`, we won't get quite the same behavior.
    // 
    // This is important because it allows us to setup these symlinks w/o needing an administrator environment!
    let cygLinkParentDir = path.dirname(cygLink);
    await spawnAsync(path.join(rootFolder, ".cygwin", "bin", "bash.exe"), ["-lc", `chmod u+rwx ${cygLinkParentDir}; ln -s "${cygOrig}" "${cygLink}"`], {
        env: {
            // We also need to override 'HOME', otherwise
            // this might be picked up from the environment.
            // This is also overridden in EsyBash.exe.
            HOME: ""
        }
    });
}

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
                debugLog("Warning - file already exists: " + dst);
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
            debugLog("Cannot find original path: " + orig + ", skipping symlink: " + link);
            return;
        }

        const linkExists = await existsAsync(link);
        if (linkExists) {
            await unlinkAsync(link);
        }

        debugLog(`Linking ${link} to ${orig}`)
        const cygLink = await toCygwinPathAsync(link);
        const cygOrig = await toCygwinPathAsync(orig);
        await createSymlink(cygOrig, cygLink);
        debugLog(`Successfully linked ${link} to ${orig}`)
    });

    await Promise.all(outerPromises);
    console.log("Links restored.");
}

module.exports = {
    consolidateLinks,
    restoreLinks
};
