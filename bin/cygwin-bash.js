#!/usr/bin/env node

"use strict"

const { runCygwin } = require("./../cygwin-run")
const args = process.argv.slice(2).join(" ")
runCygwin(args)

