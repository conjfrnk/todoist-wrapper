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

if [ ! -d "$install_dir" ]; then
  echo "$install_dir does not exist."
    echo "Using $SUDO to create $install_dir"
    $SUDO mkdir -p "$install_dir"
    echo "Using $SUDO to chown"
    $SUDO chown $USER "$install_dir"
fi

curl -L "$url" -o "$install_dir/$binary_name.zip"
unzip -o "$install_dir/$binary_name.zip" -d "$install_dir"

if [ ! -d "$install_dir" ]; then
    echo "Using $SUDO to symlink into /usr/bin"
    $SUDO ln -sf "$bin_dir/$binary_name/todoist-wrapper" /usr/bin/todoist-wrapper
fi

echo "Installation completed successfully."
