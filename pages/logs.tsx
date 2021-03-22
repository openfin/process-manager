import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { LogList } from '../components/logList'

export default function Tree() {
    const [refreshRate, setRefreshRate] = useState(1000)

    const onRefreshUpdate = (v) => {
        setRefreshRate(v)
    }


    return (
        <div>
            <PageHeader title="Process Manager - Logs" />
            <main>
                <ViewHeader onChange={onRefreshUpdate} />
                <LogList pollRate={refreshRate} />
            </main>
        </div>
    )
}
