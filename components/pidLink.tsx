export const PidLink = ({ pid }) => {
    const showPidView = () => {
        window.open(`/pid.html?pid=${pid}`, `ofpidinfo_${pid}`);
    }
    return <a onClick={showPidView} href="#">{pid}</a>
}