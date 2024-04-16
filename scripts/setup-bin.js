const fs = require('fs');
const path = require('path');

const platform = process.platform;
const binPath = path.join(__dirname, '../bin');

let executablePath;
if (platform === 'win32') {
    executablePath = 'todoist-wrapper-win32-x64/todoist-wrapper.exe';
} else if (platform === 'darwin') {
    executablePath = 'todoist-wrapper-darwin-x64/todoist-wrapper';
} else if (platform === 'linux') {
    executablePath = 'todoist-wrapper-linux-x64/todoist-wrapper';
}

const targetPath = path.join(binPath, 'todoist-wrapper');
try {
    fs.symlinkSync(path.join(binPath, executablePath), targetPath);
    console.log('Symlink created successfully.');
} catch (error) {
    console.error('Failed to create symlink:', error);
}
