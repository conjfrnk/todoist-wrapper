#!/bin/bash

# Define directories and binary
install_dir="/opt/todoist-wrapper"
symlink_path="/usr/bin/todoist-wrapper"

# Determine the privilege escalation tool
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

# Remove the symlink in /usr/bin
if [ -L "$symlink_path" ]; then
    echo "Removing symlink at $symlink_path"
    $SUDO rm "$symlink_path"
else
    echo "No symlink at $symlink_path found."
fi

# Remove the installation directory
if [ -d "$install_dir" ]; then
    echo "Removing installation directory at $install_dir"
    $SUDO rm -rf "$install_dir"
else
    echo "No installation directory at $install_dir found."
fi

echo "Uninstallation completed successfully."
