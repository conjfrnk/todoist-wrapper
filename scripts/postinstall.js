const isGlobal = process.env.npm_config_global;
if (isGlobal) {
    const https = require('https');
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Retrieve package version from package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;  // Use the version from your package.json

    const platform = os.platform();
    let filename;

    if (platform === 'win32') filename = 'todoist-wrapper-win32-x64.zip';
    else if (platform === 'darwin') filename = 'todoist-wrapper-darwin-x64.zip';
    else if (platform === 'linux') filename = 'todoist-wrapper-linux-x64.zip';

    const file = fs.createWriteStream(filename);
    const options = {
        hostname: 'github.com',
        port: 443,
        path: `/conjfrnk/todoist-wrapper/releases/download/v${version}/${filename}`,
        method: 'GET',
        headers: {
            'User-Agent': 'node.js'
        }
    };

    https.get(options, (response) => {
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log('Download Completed');
            execSync(`unzip ${filename} -d path/to/extract/`); // Adjust the path as needed
        });
    });

    file.on('error', (err) => {
        fs.unlinkSync(filename); // Clean up the file if an error occurs
        console.error('Error downloading the file:', err.message);
    });
}
