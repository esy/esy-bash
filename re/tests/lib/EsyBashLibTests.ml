let%test "can pass basic statement to bash." =
  let (out, err,  exit_code) = Helpers.run_esy_bash "echo Hello World" in
  exit_code = 0 && (Helpers.contains out "Hello World") = 0 && (err = "")


let%test "forwards exit code." =
  let (_out, _err,  exit_code) = Helpers.run_esy_bash "exit 15" in
  exit_code = 15


let%test "--env: environment file." =
  let tempFilePath =
    Sys.getenv (if Sys.unix then "TMPDIR" else "TMP") ^
      "test-env.json" in
  let fileChannel = open_out_bin tempFilePath in
  Printf.fprintf fileChannel "%s" {json|
{
  "foo": "foovalue",
  "bar": "unreal value",
  "h": ""
}
|json};
  close_out fileChannel;
  
  let (out, _err, exit_code) = Helpers.run_esy_bash ~env_file:tempFilePath "echo $foo" in
  exit_code = 0 && (Helpers.contains out "foovalue") = 0


let%test "ls command" =
  let (out, _err,  exit_code) = Helpers.run_esy_bash "ls" in
  (Helpers.contains out "test_runner.exe") != -1 && exit_code = 0

(* let%test "doesn't escape." = true (\* TODO *\)
 * let%test "can pass output to bash." = true (\* TODO *\)
 * let%test "respects the cwd parameter." = true (\* TODO *\)
 * let%test "symlinks." = true (\* TODO *\) *)
                                                           
  
