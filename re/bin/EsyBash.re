let serialiseAsOneCommand = args => {
    let sanitizedArgs = switch (Array.length(args)) {
    | 1 => args
    | _ => Array.map(a => "\"" ++ a ++ "\"", args)
    };

    String.concat(" ", Array.to_list(sanitizedArgs));
};
let sysArgvLen = Array.length(Sys.argv);
/* Argument parsing could be improved I guess, simply copied from current logic */
let exitCode =
  if (sysArgvLen > 2 && Sys.argv[1] == "--env") {
    let environmentFile = Sys.argv[2];
    let args = Array.sub(Sys.argv, 3, sysArgvLen - 3);
    EsyBashLib.bashExec(
      ~environmentFile,
      serialiseAsOneCommand(args),
    );
  } else {
    let args = Array.sub(Sys.argv, 1, sysArgvLen - 1);
    EsyBashLib.bashExec(
      serialiseAsOneCommand(args),
    );
  };

exit(exitCode);
