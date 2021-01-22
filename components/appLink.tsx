export const AppLink = ({ uuid, text }) => {
    const showAppView = () => {
        window.open(`/app.html?uuid=${uuid}`, `ofprocinfo_${uuid}`);
    }
    return <a onClick={showAppView} href="#">{text}</a>
}