import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { Workspace }  from '../components/workspace'

export default function Tree() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  const onRefreshToggle = (v) => {
    setAutoRefresh(v)
  }

  return (
    <div>
      <PageHeader title="Process Manager - Logs" />
      <main>
        <ViewHeader checked={autoRefresh} onChange={onRefreshToggle} />
        <Workspace height="600" width="800" labelHeight="28" brightness="150" pollForData={autoRefresh}/>
      </main>
    </div>
  )
}
