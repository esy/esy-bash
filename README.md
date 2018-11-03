# esy-bash
[![Build Status](https://ci.appveyor.com/api/projects/status/ml57be5cbkvwlhdu/branch/master?svg=true)](https://ci.appveyor.com/project/bryphe/esy-bash/branch/master)

Installation utilities for a bash environment - primed for Reason/OCaml


This package is intended to smooth over cases where OCaml packages rely on Unix utilities or a Bash environment.

On Linux and OS X, this package is essentially a no-op. On Windows, we install an isolated `cygwin` environment, ready to use for OCaml/OPAM, that we use to run a bash shell.


## Installation

```
 npm install
```

Installation on Windows does the following:
- Downloads `cygwin` into a `.cygwin` folder
- Installs various utilities required on `cygwin` for OCaml & Reason - `rsync`, `patch`, `mingw`, etc.
- Sets up OPAM to point to the Windows repository: https://github.com/fdopen/opam-repository-mingw/

## Usage

### Command Line

The __`esy-bash`__ command runs a script in a bash shell. On Linux and OS X, this just uses the default `bash` shell. On Windows, this delegates to the installed `cygwin` environment:

```
esy-bash echo 'HI'
```

### API

An API is also bundled:

```
const { bashExec } = require("esy-bash")

await bashExec("ls -a")
```

## License

This source code is licensed under the [MIT License](./LICENSE).

When installing, several other dependencies are downloaded - like Cygwin and the GNU utilities. These are bound by their own license terms, primarily the [GPL License](https://en.wikipedia.org/wiki/GNU_General_Public_License)


