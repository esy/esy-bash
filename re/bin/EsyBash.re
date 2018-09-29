let sysArgvLen = Array.length(Sys.argv);
/* Argument parsing could be improved I guess, simply copied from current logic */
let exitCode =
  if (sysArgvLen >= 2 && Sys.argv[1] == "--env") {
    let environmentFile = Sys.argv[2];
    EsyBashLib.bashExec(
      ~environmentFile,
      Array.sub(Sys.argv, 2, sysArgvLen - 2),
    );
  } else {
    EsyBashLib.bashExec(Array.sub(Sys.argv, 1, sysArgvLen - 1));
  };

exit(exitCode);
