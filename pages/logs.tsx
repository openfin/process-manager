import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { LogList }  from '../components/logList'

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
        <LogList pollForData={autoRefresh}/>
      </main>
    </div>
  )
}
