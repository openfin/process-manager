const fs = require('fs');
const ignoredDirectories = require('./ignoredDirectories')
const path = require('path');
const root = path.join(__dirname, '..')

function getDirectories() {
    return fs.readdirSync(root).filter(function (file) {
        return !ignoredDirectories.some(x => file === x)
            && fs.statSync(root + '/' + file).isDirectory();
    });
}

function getDirectoriesWithConfig() {
    return getDirectories().filter(dir => {
        return fs.existsSync(path.join(root, dir, 'openfin.config.json'))
    })
}

function getDirectoriesWithEntry() {
    return getDirectories().filter(dir => {
        return fs.existsSync(path.join(root, dir, 'src/main.ts'))
    })
}

module.exports = { getDirectoriesWithConfig, getDirectoriesWithEntry };