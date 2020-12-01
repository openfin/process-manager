// next.config.js

module.exports = {
    async rewrites() {
        return [
            {
                source: '/:page.html',
                destination: '/:page',
            },
        ]
    },
}