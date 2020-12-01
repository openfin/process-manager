import { useState, useEffect } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { PIDView } from '../components/pidView'

export default function PID() {
    const [pid, setPID] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true)

    const onRefreshToggle = (v: boolean) => {
        setAutoRefresh(v)
    }

    // load pid value from URL ensuring it runs only once
    useEffect(() => {
        const pid = new URL(window.location.href).searchParams.get('pid')
        setPID(pid);
    }, []);

    return (
        <div>
            <PageHeader title={`PID: ${pid}`} />
            <main>
                <ViewHeader checked={autoRefresh} onChange={onRefreshToggle}></ViewHeader>
                <PIDView pollForData={autoRefresh} pid={pid} />
            </main>
        </div>
    )
}
