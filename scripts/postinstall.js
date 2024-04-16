const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);
const version = packageJson.version;

const platform = os.platform();
let filename;

if (platform === 'win32') filename = 'todoist-wrapper-win32-x64.zip';
else if (platform === 'darwin') filename = 'todoist-wrapper-darwin-x64.zip';
else if (platform === 'linux') filename = 'todoist-wrapper-linux-x64.zip';

const file = fs.createWriteStream(filename);
https.get(`https://github.com/conjfrnk/todoist-wrapper/releases/download/${version}/${filename}`, (response) => {
    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('Download Completed');
        execSync(`unzip ${filename} -d path/to/extract/`);
    });
});

file.on('error', (err) => {
    fs.unlink(filename);
    console.error('Error downloading the file:', err.message);
});

