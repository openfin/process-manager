import getConfig from 'next/config'

export const AppLink = ({ uuid, text }) => {
    const { publicRuntimeConfig } = getConfig()
    const showAppView = () => {
        window.open(`${publicRuntimeConfig.basePath}/app.html?uuid=${uuid}`, `ofprocinfo_${uuid}`);
    }
    return <a onClick={showAppView} href="#">{text}</a>
}