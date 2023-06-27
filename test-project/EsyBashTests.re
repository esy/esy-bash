open EsyBash;

module Path = {
  include Path;
  let testable: Alcotest.testable(Path.t) =
    Alcotest.testable(Path.pp, Path.equal);
};

module Bos = {
  include Bos;
  module Cmd = {
    include Bos.Cmd;
    let testable: Alcotest.testable(Bos.Cmd.t) =
      Alcotest.testable(Bos.Cmd.pp, Bos.Cmd.equal);
  };
  module OS = {
    include Bos.OS;
    module Cmd = {
      include Bos.OS.Cmd;
      let equal_status = (a, b) =>
        switch (a, b) {
        | (`Exited(statusA), `Exited(statusB)) => statusA == statusB
        | (`Signaled(signalA), `Signaled(signalB)) => signalA == signalB
        | _ => false
        };
      let testable_status =
        Alcotest.testable(Bos.OS.Cmd.pp_status, equal_status);
    };
  };
};

module Rresult = {
  include Rresult;
  let equal_msg = (a, b) =>
    switch (a, b) {
    | (`Msg(ma), `Msg(mb)) => ma == mb
    | _ => false
    };
  let testable_msg = Alcotest.testable(Rresult.R.pp_msg, equal_msg);
};

let getPathToEsyBash = projectRoot => {
  let packageJsonPath = Filename.dirname(projectRoot) ++ "/package.json";
  let esyBashPackageJson = Yojson.Safe.from_file(packageJsonPath);
  switch (esyBashPackageJson) {
  | `Assoc(kvs) =>
    let names =
      List.filter_map(
        fun
        | ("name", `String(name)) => Some(name)
        | _ => None,
        kvs,
      );
    switch (names) {
    | [] => failwith("Field 'name' was not found in package.json")
    | [name, ..._rest] => Path.(v(projectRoot) / "node_modules" / name)
    };
  | _ => failwith("esy-bash's package.json is not a valid package.json")
  };
};

let testGetEsyBashRoot = projectRoot => {
  let pathToEsyBash = getPathToEsyBash(projectRoot);
  Alcotest.(check(Path.testable))(
    "Must return source tree path",
    EsyBash.getEsyBashRootPath(),
    pathToEsyBash /* getcwd was deep in esy local store */
  );
};

let testToEsyBashCommand = projectRoot => {
  let actual = toEsyBashCommand(Bos.Cmd.(v("curl") % "--help"));
  let pathToEsyBash = getPathToEsyBash(projectRoot);
  let pathToEsyBashExe =
    Path.(pathToEsyBash / "re" / "_build" / "default" / "bin" / "EsyBash.exe");
  Alcotest.(check(Bos.Cmd.testable))(
    "Must return equivalent esy-bash command",
    actual,
    Bos.Cmd.(v(Path.show(pathToEsyBashExe)) % "curl" % "--help"),
  );
};

let testRun = _projectRoot => {
  let cmd = toEsyBashCommand(Bos.Cmd.(v("curl") % "--help"));
  Alcotest.(check(result(Bos.OS.Cmd.testable_status, Rresult.testable_msg)))(
    "Must run equivalent esy-bash command",
    Bos.OS.Cmd.run_status(cmd),
    Ok(`Exited(0)),
  );
  let cmd = toEsyBashCommand(Bos.Cmd.(v("git") % "--help"));
  Alcotest.(check(result(Bos.OS.Cmd.testable_status, Rresult.testable_msg)))(
    "Must run equivalent esy-bash command",
    Bos.OS.Cmd.run_status(cmd),
    Ok(`Exited(0)),
  );
  let cmd = toEsyBashCommand(Bos.Cmd.(v("command-that-doesnt-exist")));
  Alcotest.(check(result(Bos.OS.Cmd.testable_status, Rresult.testable_msg)))(
    "Must run equivalent esy-bash command",
    Bos.OS.Cmd.run_status(cmd),
    Ok(`Exited(127)),
  );

  let cmd =
    toEsyBashCommand(
      Bos.Cmd.(
        v("curl")
        % "--silent"
        % "--connect-timeout"
        % "60"
        % "--retry"
        % "3"
        % "--retry-delay"
        % "5"
        % "--fail"
        % "--location"
        % "https://esy.sh"
        % "--output"
        % "/cygdrive/c/Users/manas/AppData/Local/Temp/archive"
        % "--write-out"
        % "\n%{http_code}"
      ),
    );
  Alcotest.(check(result(Bos.OS.Cmd.testable_status, Rresult.testable_msg)))(
    "Must run a real-world curl command",
    Bos.OS.Cmd.run_status(cmd),
    Ok(`Exited(0)),
  );
};

let projectRootTerm = {
  let doc = "Project sourcetree path";
  Cmdliner.Arg.(
    required
    & opt(some(string), None)
    & info(["r"], ~doc, ~docv="PROJECT_ROOT")
  );
};

let () =
  Alcotest.(
    run_with_args(
      "Testing EsyBash via Reason",
      projectRootTerm,
      [
        (
          "getEsyBashRootPath()",
          [test_case("case 1", `Quick, testGetEsyBashRoot)],
        ),
        (
          "testToEsyBashCommand()",
          [test_case("case 1", `Quick, testToEsyBashCommand)],
        ),
        ("testRun()", [test_case("case 1", `Quick, testRun)]),
      ],
    )
  );
