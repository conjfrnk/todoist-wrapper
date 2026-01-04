#!/bin/bash
set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Set up RPM build directories
mkdir -p ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

# Create the source zip from the packaged app
cd dist
zip -r ~/rpmbuild/SOURCES/todoist-wrapper-linux-x64.zip todoist-wrapper-linux-x64/
cd ..

# Copy spec file
cp rpm/todoist-wrapper.spec ~/rpmbuild/SPECS/

# Build the RPM
rpmbuild -bb ~/rpmbuild/SPECS/todoist-wrapper.spec \
    --define "_version $VERSION"

echo "RPM built successfully!"
echo "Output: ~/rpmbuild/RPMS/x86_64/todoist-wrapper-${VERSION}-1.*.rpm"
