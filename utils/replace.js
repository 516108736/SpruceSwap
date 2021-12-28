const fs = require('fs');

module.exports = function replace(path, regex, replacedContent) {
    // load the html file
    var fileContent = fs.readFileSync(path, 'utf8');

    fileContent = fileContent.replace(regex, replacedContent);

    // this will overwrite the original html file, change the path for test
    fs.writeFileSync(path, fileContent);
}