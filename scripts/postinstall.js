const isGlobal = process.env.npm_config_global;
if (isGlobal) {
    const https = require('https');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { execSync } = require('child_process');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;

    const platform = os.platform();
    let filename;

    if (platform === 'win32') filename = 'todoist-wrapper-win32-x64.zip';
    else if (platform === 'darwin') filename = 'todoist-wrapper-darwin-x64.zip';
    else if (platform === 'linux') filename = 'todoist-wrapper-linux-x64.zip';

    const filePath = path.join(__dirname, filename);
    const file = fs.createWriteStream(filePath);

    https.get(`https://github.com/conjfrnk/todoist-wrapper/releases/download/${version}/${filename}`, (response) => {
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log('Download Completed');

            try {
                execSync(`unzip -o ${filePath} -d ${path.join(__dirname, 'target_directory')}`); // Ensure target_directory is correct
                console.log('Extraction completed');
            } catch (error) {
                console.error('Failed to extract:', error);
            }
        });
    }).on('error', (error) => {
        fs.unlink(filePath, () => {}); // Delete the corrupt file
        console.error('Failed to download:', error);
    });
}
