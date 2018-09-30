let serialiseAsOneCommand = args => String.concat(" ", Array.to_list(args));
let sysArgvLen = Array.length(Sys.argv);
/* Argument parsing could be improved I guess, simply copied from current logic */
let exitCode =
  if (sysArgvLen >= 2 && Sys.argv[1] == "--env") {
    let environmentFile = Sys.argv[2];
    EsyBashLib.bashExec(
      ~environmentFile,
      serialiseAsOneCommand(Array.sub(Sys.argv, 3, sysArgvLen - 3)),
    );
  } else {
    EsyBashLib.bashExec(
      serialiseAsOneCommand(Array.sub(Sys.argv, 1, sysArgvLen - 1)),
    );
  };

exit(exitCode);
