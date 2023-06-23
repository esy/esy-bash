param([String] $TempDir)

$ErrorActionPreference = "Stop"

filter timestamp {"$(Get-Date -Format o): $_"}

function Run {
    [CmdletBinding()]
    Param
    (
        [parameter(mandatory=$true, position=0)][string]$Cmd,
        [parameter(mandatory=$false, position=1, ValueFromRemainingArguments=$true)]$Args
    )

    & $Cmd $Args | timestamp
    if (! $?) {
	exit(-1);
    }
}

# We have to run this for every test run because
# tarball name changes for every commit on the CI
# (Because of the commit hash in the version)
function Install-In-Test-Project {

    param([String] $TempDir)

    $PackageJson = Get-Content ./package.json -Raw | ConvertFrom-Json
    $PackageJsonName = $PackageJson.name
    $PackageNamespace, $PackageName = $PackageJsonName.split("/")

    if (!$PackageName) {
	$PackageName = $PackageNamespace
	$PackageNamespace = ""
    }
    $PackageVersion = $PackageJson.version
    $TarballName = "$PackageName-$PackageVersion.tgz"
    if ($PackageNamespace) {
	$PackageNamespaceWithoutAt = $PackageNamespace.replace('@', '')
	$TarballName = "$PackageNamespaceWithoutAt-$TarballName"
    }

    $FullTarballPath = Resolve-Path($TarballName)
    echo "Tarball Path: $FullTarballPath"
    cd ./test-project
    npm i $FullTarballPath
    cd ..
}

echo "Building EsyBash.exe"
Run npm run build-exe

echo "Download cygwin packages and store them at .cygwin/var/cache/setup"
Run npm run download-packages

# npm run test-exe # Skipped because inline tests dont work on Windows without sys/time.h

echo "NPM packing"
Run npm pack
Install-In-Test-Project -TempDir $TempDir
cd "./test-project"
echo "npm i"
Run npm i
echo "npm run test"
Run npm run test
