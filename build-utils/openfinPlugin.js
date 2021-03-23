const { launch } = require('openfin-adapter');

let firstLaunch = true;
module.exports = class OpenFinPlugin {
    constructor({ manifestUrl }) {
        this.manifestUrl = manifestUrl;
    }
    apply(compiler) {
        compiler.hooks.done.tap('OpenFinPlugin', (compilation, callback) => {
            if (firstLaunch) {
                console.log('launching app at: ' + this.manifestUrl)
                launch({ manifestUrl: this.manifestUrl });
                firstLaunch = false;
            }
        })
    }
}