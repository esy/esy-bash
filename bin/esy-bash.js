#!/usr/bin/env node

"use strict"

const { bashExec } = require("./../index")

let opts = null

if (process.argv.length >= 3 && process.argv[2] === "--env") {
    opts = {
        environmentFile: process.argv[3]
    }
}


const argsToSend = opts ? process.argv.slice(4) : process.argv.slice(2);
const sanitizeArgs = (args) => args.map(a => "\"" + a + "\"").join(" ");

const sanitizedArgs = argsToSend.length > 1 ? sanitizeArgs(argsToSend) : argsToSend[0]

bashExec(sanitizedArgs, opts).then((code) => {
    process.exit(code)
})
