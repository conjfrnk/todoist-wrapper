#!/bin/bash

binary_name="todoist-wrapper-linux-x64"
url="https://github.com/conjfrnk/todoist-wrapper/releases/latest/download/$binary_name.zip"
install_dir="/opt/todoist-wrapper"
bin_dir="$install_dir/bin"

if command -v doas &> /dev/null
then
    SUDO="doas"
elif command -v sudo &> /dev/null
then
    SUDO="sudo"
else
    echo "No method to elevate privileges (doas or sudo) found. Exiting."
    exit 1
fi

echo "Using $SUDO to download"
$SUDO mkdir -p "$install_dir"
echo "Using $SUDO to chown"
$SUDO chown $USER "$install_dir"

curl -L "$url" -o "$install_dir/$binary_name.zip"
unzip -o "$install_dir/$binary_name.zip" -d "$install_dir"

echo "Using $SUDO to symlink into /usr/bin"
$SUDO ln -sf "$bin_dir/$binary_name/todoist-wrapper" /usr/bin/todoist-wrapper

echo "Installation completed successfully."
