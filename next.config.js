// next.config.js
const path = require('path')

const CopyWebpackPlugin = require('copy-webpack-plugin');
const OpenFinPlugin = require('./build-utils/openfinPlugin.js');
const host = process.env.HOST || 'http://localhost:3000';
const basePath = process.env.BASE_PATH || '';

module.exports = {
    async rewrites() {
        return [
            {
                source: '/:page.html',
                destination: '/:page',
            },
        ]
    },
    experimental: {
        productionBrowserSourceMaps: true
    },
    webpack: (config, { isServer, webpack }) => {
        // copy app.json and replace ROOT_URL
        if (!isServer) {
            config.plugins.push(new CopyWebpackPlugin(
                [
                    {
                        from: path.join(__dirname, 'app.json'), 
                        to: path.join(__dirname, 'public', 'app.json'), 
                        transform: (contents) => {
                            let manif = contents.toString().replace(/ROOT_URL/g, host);
                            return manif;
                        }
                    }
                ]
            )) 
            config.plugins.push(new OpenFinPlugin({manifestUrl: 'http://localhost:3000/app.json'}))   
        }
        // Important: return the modified config
        return config
    },
    basePath: basePath,
}