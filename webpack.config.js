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
        plugins: [
            new CopyWebpackPlugin([
                { from: './resources' },
                { from: './app.json'}
            ])
        ]
    }
];
