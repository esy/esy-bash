# esy-cygwin
[![Build Status](https://travis-ci.org/bryphe/esy-cygwin.svg?branch=master)](https://travis-ci.org/bryphe/esy-cygwin) [![Build Status](https://ci.appveyor.com/api/projects/status/gum9hty9hm65o7ae/branch/master?svg=true)](https://ci.appveyor.com/project/bryphe/esy-cygwin/branch/master)

Installation utilities for Cygwin - primed for Reason/OCaml

This package provides a ready-to-use Cygwin environment, with OCaml installed and set up with the OPAM repository for Windows.

On Linux and OS X, this package is not necessary.

## Installation

```
 npm install
```

Installation does the following:
- Downloads `cygwin` into a `.cygwin` folder
- Installs various utilities required on `cygwin` for OCaml & Reason - `rsync`, `patch`, `mingw`, etc.
- Sets up OPAM to point to the Windows repository: https://github.com/fdopen/opam-repository-mingw/

## Usage

### Bash

Cygwin bundles a `bash` shell, which can be found at `.cygwin/bin/bash.exe` - you can use this to run commands, like:

```bash
> .\cygwin\bin\bash.exe -lc "ocaml --version"
The OCaml toplevel, version 4.03.0
```

## License

This source code is licensed under the [MIT License](./LICENSE).

When installing, several other dependencies are downloaded - like Cygwin and the GNU utilities. These are bound by their own license terms.


