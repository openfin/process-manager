const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const outputDir = path.resolve(__dirname, './build')

/**
 * Modules to be exported
 */
module.exports = [
    {
        entry: './src/main.tsx',
        output: {
            path: outputDir,
            filename: 'pack/main-react.js'
        },
        resolve: {
            extensions: ['.tsx', '.js', '.ts']
        },
        devtool: 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loaders: ["ts-loader"],
                },
                {
                    test: /\.css$/,
                    loaders: ["css-loader"],
                },
                {
                    test: /\.less$/,
                    use: [
                        {
                            loader: 'style-loader'
                        }, {
                            loader: 'css-loader'
                        }, {
                            loader: 'less-loader',
                            options: {
                                javascriptEnabled: true
                            }
                        }
                    ]
                }
            ]
        },
        plugins: getWebpackPlugins()
    }
];

function getWebpackPlugins() {
    let plugs = [];
    const urls = [
        { name: 'local', url: 'http://localhost:8085' },
        { name: 'deployed', url: 'https://cdn.openfin.co/demos/process-manager2' }
    ]
    plugs[plugs.length] = new CopyWebpackPlugin([{ from: './resources' }]);
    for (let u in urls) {
        const url = urls[u];
        let filePref = 'app';
        if (url.name === 'local') {
            filePref = 'app.local';
        }
        plugs[plugs.length] = makeCopyPlugin('stable', filePref, url);
        plugs[plugs.length] = makeCopyPlugin('alpha', filePref, url);
        plugs[plugs.length] = makeCopyPlugin('beta', filePref, url);
        plugs[plugs.length] = makeCopyPlugin('canary', filePref, url);
    }
    return plugs;
}

function makeCopyPlugin(runtime, filePref, url) {
    return new CopyWebpackPlugin([
        { from: './app.json', to: `${filePref}.${runtime}.json`, transform: (contents) => {
            let manif = contents.toString().replace(/ROOT_URL/g, url.url);
            const config = JSON.parse(manif);
            const newConf = Object.assign({}, config);
            newConf.runtime.version = runtime;
            return JSON.stringify(newConf, null, 4);
        }}
    ])
}
