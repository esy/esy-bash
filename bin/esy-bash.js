#!/usr/bin/env node

"use strict"

const { bashExec } = require("./../index")
const args = process.argv.slice(2).join(" ")

bashExec(args).then((code) => {
    process.exit(code)
})
