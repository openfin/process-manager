import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { Workspace } from '../components/workspace'

export default function Tree() {
    const [refreshRate, setRefreshRate] = useState(1000)

    const onRefreshUpdate = (v) => {
        setRefreshRate(v)
    }

    return (
        <div>
            <PageHeader title="Process Manager - Workspace" />
            <main>
                <ViewHeader onChange={onRefreshUpdate} />
                <Workspace pollRate={refreshRate} initialHeight="600" initialWidth="800" headerHeight="58" brightness="150" />
            </main>
        </div>
    )
}
