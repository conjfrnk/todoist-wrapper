const isGlobal = process.env.npm_config_global;
if (isGlobal) {
    const https = require('https');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const platform = os.platform();
    let binaryName;
    switch(platform) {
        case 'win32': binaryName = 'todoist-wrapper-win32-x64.exe'; break;
        case 'darwin': binaryName = 'todoist-wrapper-darwin-x64'; break;
        case 'linux': binaryName = 'todoist-wrapper-linux-x64'; break;
        default: throw new Error(`Unsupported platform: ${platform}`);
    }

    const url = `https://github.com/conjfrnk/todoist-wrapper/releases/latest/download/${binaryName}`;

    const binPath = path.join(__dirname, 'bin');
    const filePath = path.join(binPath, 'todoist-wrapper');

    // Ensure the bin directory exists
    fs.mkdirSync(binPath, { recursive: true });

    // Function to download the file
    const download = (url, dest, cb) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(cb);
                // Make sure the binary is executable
                fs.chmodSync(dest, 0o755);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // Delete the file async if there was an error
            cb(err.message);
        });
    };

    // Download and save the binary to the 'bin' directory
    download(url, filePath, (error) => {
        if (error) {
            console.error('Failed to download and save binary:', error);
            process.exit(1);
        } else {
            console.log('Binary downloaded and installed successfully.');
        }
    });

}
