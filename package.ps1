$ErrorActionPreference = "Stop"

filter timestamp {"$(Get-Date -Format o): $_"}

function New-TemporaryDirectory {
    $parent = [System.IO.Path]::GetTempPath()
    [string] $name = [System.Guid]::NewGuid()
    New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

function Install-In-Test-Project {
    $PackageJson = Get-Content ./package.json -Raw | ConvertFrom-Json
    $PackageNamespace, $PackageName = $PackageJson.name.split("/")

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
    $TempDir = New-TemporaryDirectory
    echo "Changing directory to ${TempDir}"
    cd $TempDir
    $PackageJsonPath = Join-Path $TempDir "package.json"
    echo "{}" > $PackageJsonPath
    echo "Will run: npm i ${FullTarballPath}"
    npm i $FullTarballPath
    $NodemodulePath = $PackageName
    if ($PackageNamespace) {
	$NodemodulePath = Join-Path $PackageNamespace $PackageName
    }
    return Join-Path (Join-Path $TempDir "node_modules") $NodemodulePath 
}

echo "Building EsyBash.exe"
npm run build-exe | timestamp
echo "Download cygwin packages and store them at .cygwin/var/cache/setup"
npm run download-packages | timestamp
# npm run test-exe # Skipped because inline tests dont work on Windows without sys/time.h
echo "NPM packing"
npm pack | timestamp
$TestProjectEsyBashPath = Install-In-Test-Project
cd $TestProjectEsyBashPath
echo "npm run test"
npm run test | timestamp
