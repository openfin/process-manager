import { useState, useEffect } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { AppView } from '../components/appView'

export default function PID() {
    const [uuid, setUUID] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true)

    const onRefreshToggle = (v: boolean) => {
        setAutoRefresh(v)
    }

    // load pid value from URL ensuring it runs only once
    useEffect(() => {
        const id = new URL(window.location.href).searchParams.get('uuid')
        setUUID(id);
    }, []);

    return (
        <div>
            <PageHeader title={`Process Manager - App: ${uuid}`} />
            <main>
                <ViewHeader checked={autoRefresh} onChange={onRefreshToggle}></ViewHeader>
                <AppView pollForData={autoRefresh} uuid={uuid} />
            </main>
        </div>
    )
}
