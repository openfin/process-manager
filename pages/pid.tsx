import { useState, useEffect } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { PIDView } from '../components/pidView'

export default function PID() {
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [pid, setPID] = useState('');
    useEffect(() => {
        const url = new URL(window.location.href)
        const pid = url.searchParams.get('pid')
        setPID(pid);
    });


    const onRefreshToggle = (v: boolean) => {
        setAutoRefresh(v)
    }

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
