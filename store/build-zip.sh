#!/bin/bash
# Build Chrome Web Store submission ZIP
# Usage: bash store/build-zip.sh

set -e

VERSION=$(node -e "console.log(require('./manifest.json').version)")
ZIPNAME="carbonlite-v${VERSION}.zip"
OUTDIR="store"

echo "Building ${ZIPNAME}..."

# Clean previous build
rm -f "${OUTDIR}/${ZIPNAME}"

# Create ZIP with only the files Chrome needs (no tests, specs, node_modules, etc.)
zip -r "${OUTDIR}/${ZIPNAME}" \
  manifest.json \
  background.js \
  content.js \
  privacy.html \
  icons/ \
  libs/co2.js \
  libs/constants.js \
  libs/classifier.js \
  libs/recommendations.js \
  libs/grading.js \
  libs/benchmarks.js \
  libs/migrations.js \
  libs/message-router.js \
  sidepanel/panel.html \
  sidepanel/panel.css \
  sidepanel/panel-core.js \
  sidepanel/panel-render.js \
  sidepanel/panel-breakdown.js \
  sidepanel/panel-actions.js \
  options/options.html \
  options/options.js \
  options/options.css \
  onboarding/onboarding.html \
  onboarding/onboarding.js \
  onboarding/onboarding.css \
  -x "icons/generate-icons.html" \
  -x "icons/icon.svg" \
  -x "*.DS_Store"

echo ""
echo "Created: ${OUTDIR}/${ZIPNAME}"
echo "Size: $(du -h "${OUTDIR}/${ZIPNAME}" | cut -f1)"
echo ""
echo "Contents:"
unzip -l "${OUTDIR}/${ZIPNAME}" | tail -n +4 | head -n -2 | awk '{print "  " $4}'
echo ""
echo "Ready to upload at: https://chrome.google.com/webstore/devconsole"
