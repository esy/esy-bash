exception InvalidEnvJSON(string);

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

let bashExec = (~environmentFile=?, args) => {
  let attachShellToIO =
    switch (environmentFile) {
    | Some(x) =>
      Unix.create_process_env(
        "/bin/bash",
        [|
          "-c",
          "/Users/manas/development/prometheansacrifice/esy-bash/re/blah.sh",
        |],
        Array.of_list(extractEnvironmentVariables(x)),
      )
    | None =>
      Unix.create_process(
        "/bin/bash",
        [|
          "-c",
          "/Users/manas/development/prometheansacrifice/esy-bash/re/blah.sh",
        |],
      )
    };
  attachShellToIO(Unix.stdin, Unix.stdout, Unix.stderr);
};
