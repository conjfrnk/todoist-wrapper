#!/bin/bash

binary_name="todoist-wrapper-linux-x64"
url="https://github.com/conjfrnk/todoist-wrapper/releases/latest/download/$binary_name.zip"
install_dir="/opt/todoist-wrapper"
app_dir="$install_dir/$binary_name"

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

# Handle nested directory structure from zip
if [ -d "$install_dir/dist/$binary_name" ]; then
    mv "$install_dir/dist/$binary_name"/* "$install_dir/" 2>/dev/null || true
    rm -rf "$install_dir/dist"
fi

# Create symlink
echo "Using $SUDO to symlink into /usr/bin"
$SUDO ln -sf "$install_dir/todoist-wrapper" /usr/bin/todoist-wrapper

# Install desktop file
if [ -d "/usr/share/applications" ]; then
    echo "Installing desktop file..."
    $SUDO cp "$install_dir/resources/app/assets/todoist-wrapper.desktop" /usr/share/applications/ 2>/dev/null || \
    cat << 'EOF' | $SUDO tee /usr/share/applications/todoist-wrapper.desktop > /dev/null
[Desktop Entry]
Name=Todoist
Comment=Electron Wrapper for Todoist
Exec=todoist-wrapper
Icon=todoist-wrapper
Terminal=false
Type=Application
Categories=Office;ProjectManagement;
Keywords=todo;task;productivity;todoist;
StartupWMClass=todoist-wrapper
EOF
fi

echo "Installation completed successfully."
