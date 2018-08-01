const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const outputDir = path.resolve(__dirname, './build')

/**
 * build rudimentary webpack config for typescript (client/provider)
 * @param {string} infile The entry point to the application (usually a js file)
 * @param {string} outfile The name of the packed output file
 * @return {Object} A webpack module
 */
function createWebpackConfigForTS(infile, outfile) {
    return Object.assign({
        entry: infile,
        output: {
            path: outputDir,
            filename: outfile + '.js'
        },
        resolve: {
            extensions: ['.ts']
        },
        module: {
            rules: [
                {
                    test: /\.ts/,
                    loader: 'ts-loader'
                }
            ]
        }
    });
}

/**
 * build webpack config for the provider side
 * @return {Object} A webpack module
 */
function createWebpackConfig() {
    return Object.assign(
        createWebpackConfigForTS('./src/main.ts', 'pack/main'),
        { 
            plugins: [
                new CopyWebpackPlugin([
                    { from: './resources' }
                ])
            ]
        }
    )
}

/**
 * Modules to be exported
 */
module.exports = [
    createWebpackConfig()
];
