module.exports = [
  // Needed for cross-compilation to Windows native executables
  "mingw64-x86_64-gcc-core",
  "mingw64-x86_64-gcc-g++",
  "mingw64-x86_64-headers",
  "mingw64-x86_64-runtime",
  "mingw64-x86_64-winpthreads",

  // Linux utilities - 'bashisms' to support development
  "curl",
  "diff",
  "diffutils",
  "git",
  "m4",
  "make",
  "patch",
  "unzip",
  "python",
  "bash",

  // Needed for installing the cygwin-build of OCaml
  // May not be needed
  // "gcc-g++",
  // "flexdll",
];
