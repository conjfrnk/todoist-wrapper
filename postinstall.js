const isGlobal = process.env.npm_config_global;
if (isGlobal) {
    const https = require('https');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const AdmZip = require('adm-zip');

    const version = require('package.json').version;
    const platform = os.platform();

    let filename;
    switch (platform) {
        case 'win32':
            filename = `todoist-wrapper-win32-x64.zip`;
            break;
        case 'darwin':
            filename = `todoist-wrapper-darwin-x64.zip`;
            break;
        case 'linux':
            filename = `todoist-wrapper-linux-x64.zip`;
            break;
        default:
            throw new Error('Unsupported platform');
    }

    const targetPath = path.join(__dirname, 'bin');
    const filePath = path.join(__dirname, filename);

    const fileUrl = `https://github.com/conjfrnk/todoist-wrapper/releases/download/v${version}/${filename}`;
    const file = fs.createWriteStream(filePath);

    https.get(fileUrl, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            console.log('Download Completed');

            const zip = new AdmZip(filePath);
            zip.extractAllTo(targetPath, true);

            const extractedFilePath = path.join(targetPath, 'todoist-wrapper'); // Adjust this path if the binary is nested in folders within the zip
            if (platform !== 'win32') {
                fs.chmodSync(extractedFilePath, '755'); // Make file executable on Unix
            }

            console.log('Extraction completed to', extractedFilePath);
        });
    }).on('error', function(err) {
        fs.unlink(filePath, () => {});
        console.error('Error downloading the file:', err.message);
    });
}
