exception InvalidEnvJSON(string);
exception InvariantViolation(unit);

let pathDelimStr = Sys.os_type == "Unix" ? "/": "\\";
let pathDelimChr =  String.get(pathDelimStr, 0);

let normalizePath = str =>
  String.concat("/", String.split_on_char(pathDelimChr, str));

let normalizeEndlines = str =>
  String.concat("\n", Str.split(Str.regexp("\r\n"), str));

let remapPathsInEnvironment = envVars =>
  Array.map(
    envVar =>
      switch (String.split_on_char('=', envVar)) {
      | [k, v, ...rest] =>
        if (String.lowercase_ascii(k) == "path") {
          "PATH=" ++ normalizePath(v);
        } else {
          k ++ "=" ++ v;
        }
      | _ => raise(InvariantViolation())
      },
    envVars,
  );

let collectKeyValuePairs = jsonKeyValuePairs =>
  List.map(
    pair => {
      let (k, jsonValue) = pair;
      switch (jsonValue) {
      | `String(a) => k ++ "=" ++ a
      | _ => raise(InvalidEnvJSON("Not a valid env json file"))
      };
    },
    jsonKeyValuePairs,
  );

let rec traverse = json =>
  switch (json) {
  | `Assoc(keyValuePairs) => collectKeyValuePairs(keyValuePairs)
  | _ => raise(InvalidEnvJSON("Not a valid env json file"))
  };

let extractEnvironmentVariables = environmentFile => {
  let json = Yojson.Basic.from_file(environmentFile);
  traverse(json);
};

let nonce = ref(0);
let bashExec = (~environmentFile=?, command) => {
  let shellPath = Sys.os_type == "Unix" ? "/bin/bash": "C:\\cygwin\\bin\\bash.exe"; /* "..\\.cygwin\\bin.bash.exe"; */
  nonce := nonce^ + 1;
  /* Is this really important? exec* api won't print it*/
  /* Printf.printf( */
  /*   "esy-bash: executing bash command: %s |  nonce %s\n", */
  /*   command, */
  /*   string_of_int(nonce^), */
  /* ); */
  let tmpFileName =
    Printf.sprintf(
      "__esy-bash__%s__%s__.sh",
      string_of_int(Hashtbl.hash(command)),
      string_of_int(nonce^),
    );
  let tempFilePath = Sys.getenv(Sys.os_type == "Unix" ? "TMPDIR" : "TMP") ++ pathDelimStr ++ tmpFileName;
  let cygwinSymlinkVar = "CYGWIN=winsymlinks:nativestrict";

  let bashCommandWithDirectoryPreamble =
      Printf.sprintf(
        "cd %s;\n%s;",
        normalizePath(Sys.getcwd()),
        command,
      );
  let normalizedShellScript =
    normalizeEndlines(bashCommandWithDirectoryPreamble);
  
  let fileChannel = open_out_bin(tempFilePath);
  Printf.fprintf(fileChannel, "%s", normalizedShellScript);
  close_out(fileChannel);

  switch (environmentFile) {
  | Some(x) =>
    let vars =
      remapPathsInEnvironment(
        Array.of_list([cygwinSymlinkVar, ...extractEnvironmentVariables(x)]),
      );
    let existingVars = Unix.environment();
    Unix.execve(
      shellPath,
      [|Sys.os_type == "Unix" ? "-c": "-lc",  tempFilePath |],
      Array.append(existingVars, vars),
    );
  | None => Unix.execv(shellPath, [|Sys.os_type == "Unix" ? "-c": "-lc", tempFilePath|])
  };
};
