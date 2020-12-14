import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { ProcessTree }  from '../components/processTree'
import { Button } from 'antd';

export default function Tree() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  const onRefreshToggle = (v) => {
    setAutoRefresh(v)
  }

  return (
    <div>
      <PageHeader title="Process Manager - Applications" />
      <main>
        <ViewHeader checked={autoRefresh} onChange={onRefreshToggle}>
            <Button size="small">Open</Button>
            <Button size="small">Launch</Button>
        </ViewHeader>
        <ProcessTree headerHeight={115} scrollX={800} scrollY={600} pollForData={autoRefresh}/>
      </main>
    </div>
  )
}
