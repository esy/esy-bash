/* Copied from esy's source */



module Path = {
  include Fpath;
  let show = to_string;
};
  
/**
 * Helper method to get the root path of the 'esy-bash' node modules
 */
let getEsyBashRootPath = (): Path.t =>
  switch (Sys.getenv_opt("SOURCETREE")) {
  | Some(path) =>
    let packageJsonPath = Filename.dirname(path) ++ "/package.json";
    let esyBashPackageJson = Yojson.Safe.from_file(packageJsonPath);
    switch(path |> Path.of_string) {
      | Ok(path) =>
      switch (esyBashPackageJson) {
      | `Assoc (kvs) => {
          let names = List.filter_map(fun
                          | ("name", `String(name)) => Some(name)
                          | _ => None, kvs);
          switch(names) {
          | [] => failwith("Field 'name' was not found in package.json")
          | [name, ..._rest] => Path.(path / "node_modules" / name)
          }
        }
      | _ => failwith("esy-bash's package.json is not a valid package.json")
      }
      | Error(`Msg(m)) => failwith(m)
    }
  | None => failwith("Please set SOURCETREE")
  };

/**
 * Helper method to get the `cygpath` utility path
 * Used for resolving paths
 */
let getCygPath = () =>
  Path.(getEsyBashRootPath() / ".cygwin" / "bin" / "cygpath.exe");

let getBinPath = () => Path.(getEsyBashRootPath() / ".cygwin" / "bin");

let getEsyBashPath = () =>
  Path.(
    getEsyBashRootPath() / "re" / "_build" / "default" / "bin" / "EsyBash.exe"
  );

let getMingwRuntimePath = () => {
  let rootPath = getEsyBashRootPath();
  Path.(
    rootPath
    / ".cygwin"
    / "usr"
    / "x86_64-w64-mingw32"
    / "sys-root"
    / "mingw"
    / "bin"
  );
};


let toEsyBashCommand = (~env=None, cmd) => {
  let environmentFilePath =
    switch (env) {
    | None => []
    | Some(fp) => ["--env", fp]
    };

  Sys.win32
    ? {
      let commands = Bos.Cmd.to_list(cmd);
      let esyBashPath = getEsyBashPath();
      let allCommands = List.append(environmentFilePath, commands);
      Bos.Cmd.of_list([Path.show(esyBashPath), ...allCommands]);
    }
    : cmd;
};
