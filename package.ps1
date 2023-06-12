echo "Installing NPM dependencies"
npm install
echo "Building EsyBash.exe"
npm run build-exe
echo "Download and setup Cygwin"
npm run build-cygwin
# npm run test-exe # Skipped because inline tests dont work on Windows without sys/time.h
echo "npm run test: before packing"
npm run test
echo "Consolidate links and package cygwin"
npm run package-cygwin
echo "NPM packing"
npm pack
# echo "node postinstall.js (iteration 1)"
# node postinstall.js
# echo "npm run test: after unpack (iteration 1)"
# npm run test
