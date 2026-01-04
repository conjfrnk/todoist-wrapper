Name:           todoist-wrapper
Version:        %{_version}
Release:        1%{?dist}
Summary:        Electron Wrapper for Todoist

License:        MIT
URL:            https://github.com/conjfrnk/todoist-wrapper
Source0:        todoist-wrapper-linux-x64.zip

BuildArch:      x86_64
Requires:       gtk3, libnotify, nss, libXScrnSaver, libXtst, xdg-utils, at-spi2-atk, libdrm, mesa-libgbm, alsa-lib

%description
A lightweight Electron wrapper for Todoist with Wayland support.
Provides a native desktop experience for the Todoist web application.

%prep
%setup -q -c -n todoist-wrapper-linux-x64

%install
mkdir -p %{buildroot}/opt/todoist-wrapper
mkdir -p %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{_datadir}/applications

cp -r dist/todoist-wrapper-linux-x64/* %{buildroot}/opt/todoist-wrapper/

ln -sf /opt/todoist-wrapper/todoist-wrapper %{buildroot}%{_bindir}/todoist-wrapper

cat > %{buildroot}%{_datadir}/applications/todoist-wrapper.desktop << 'EOF'
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

%files
/opt/todoist-wrapper
%{_bindir}/todoist-wrapper
%{_datadir}/applications/todoist-wrapper.desktop

%changelog
* %(date "+%a %b %d %Y") Connor Frank <connor@conjfrnk.com> - %{_version}-1
- Automated build from GitHub Actions
