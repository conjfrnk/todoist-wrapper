const isGlobal = process.env.npm_config_global;
if (isGlobal) {
    const https = require('https');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const { exec } = require('child_process');

    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;

    const platform = os.platform();
    let filename, extractCommand;

    // Define the directory where you want to extract your binaries
    const targetExtractionPath = path.join(__dirname, 'bin', 'todoist-wrapper');

    // Update the extraction commands to point to the targetExtractionPath
    if (platform === 'win32') {
        filename = `todoist-wrapper-win32-x64.zip`;
        // Adjust the command to extract to the specified directory for Windows
        extractCommand = `powershell -command "Expand-Archive -Path ${filename} -DestinationPath ${targetExtractionPath}"`;
    } else {
        filename = `todoist-wrapper-${platform}-x64.zip`;
        extractCommand = `unzip -o ${filename} -d ${targetExtractionPath}`;
    }

    const filePath = path.join(__dirname, filename);
    const fileUrl = `https://github.com/conjfrnk/todoist-wrapper/releases/download/v${version}/${filename}`;

    const file = fs.createWriteStream(filePath);
    https.get(fileUrl, function(response) {
        response.pipe(file);

        file.on('finish', function() {
            file.close();
            console.log('Download Completed');

            // Execute the extraction command
            exec(extractCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Extraction error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Extraction stderr: ${stderr}`);
                    return;
                }
                console.log(`Extraction stdout: ${stdout}`);
            });
        });
    }).on('error', function(err) {
        fs.unlink(filePath, () => {});  // Delete the corrupt file
        console.error('Failed to download:', err.message);
    });

}
