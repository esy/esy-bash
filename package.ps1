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

echo "Building EsyBash.exe"
Run npm run build-exe

echo "Download cygwin packages and store them at .cygwin/var/cache/setup"
Run npm run download-packages

# npm run test-exe # Skipped because inline tests dont work on Windows without sys/time.h

echo "NPM packing"
Run npm pack

echo "node postinstall.js"
Run node postinstall.js

echo "npm run test"
Run npm run test
