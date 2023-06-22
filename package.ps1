$ErrorActionPreference = "Stop"

filter timestamp {"$(Get-Date -Format o): $_"}

echo "Building EsyBash.exe"
npm run build-exe | timestamp
echo "Download cygwin packages"
npm run download-packages | timestamp
# npm run test-exe # Skipped because inline tests dont work on Windows without sys/time.h
echo "NPM packing"
npm pack | timestamp
echo "node postinstall.js"
node postinstall.js | timestamp
echo "npm run test"
npm run test | timestamp
