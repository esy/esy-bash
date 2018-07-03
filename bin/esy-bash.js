#!/usr/bin/env node

"use strict"

const { bashExec } = require("./../index")

let opts = null

if (process.argv.length >= 3 && process.argv[2] === "--env") {
    opts = {
        environmentFile: process.argv[3]
    }
}

const args = opts ? process.argv.slice(4).join(" ") : process.argv.slice(2).join(" ")
console.log(args)

bashExec(args, opts).then((code) => {
    process.exit(code)
})
