const fs = require("fs");
const path = require("path");


const cygwinFolder = path.join(__dirname, "..", ".cygwin");

const getNameForKey = (key) => {
    return key.trim().split("/").join("_s_");
}

const readLinks = () => {
    const linkInfo = fs.readFileSync(path.join(cygwinFolder, "links.json")).toString("utf8");
    return JSON.parse(linkInfo);
}

const consolidateLinks = () => {
    // Take the links as input, and:
    // 1) Move the executables to a 'links' folder
    // 2) Delete all linked references

    if(!fs.existsSync(path.join(cygwinFolder, "_links"))) {
        fs.mkdirSync(path.join(cygwinFolder, "_links"));
    }

    const links = readLinks();
    Object.keys(links).forEach((key) => {
        const l = links[key];

        const src = path.join(cygwinFolder, path.normalize(key.trim()));
        const dst = path.join(cygwinFolder, "_links", getNameForKey(key));
        console.log("Source folder: " + src);
        console.log("Dest folder: " + dst);

        try {
        fs.copyFileSync(src, dst);
        } catch (ex) {
            console.error(ex);
            exit(1);
        }

        l.forEach((file) => {
            const fileToDelete = path.join(cygwinFolder, path.normalize(file.trim()));
            console.log(`Deleting: ${fileToDelete}`);
            if (!fs.existsSync(fileToDelete)) {
                console.warn("- Not present: " + fileToDelete);
            } else {
                fs.unlinkSync(fileToDelete);
            }
        })
    });
}

const restoreLinks = () => {
    // Take links as input, and:
    // Create hardlinks from the '_links' folder to all the relevant binaries

    const links = readLinks();

    Object.keys(links).forEach((key) => {
        const l = links[key];

        const src = path.join(cygwinFolder, "_links", getNameForKey(key));

        l.forEach((file) => {
            const dst = path.join(cygwinFolder, file.trim());

            if (fs.existsSync(dst)) {
                console.warn("Warning - file already exists: " + dst);
            } else {
                fs.linkSync(src, dst);
            }
        })
    });
}

consolidateLinks();
// restoreLinks();
