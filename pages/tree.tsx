import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { ViewHeader } from '../components/viewHeader'
import { ProcessTree }  from '../components/processTree'
import { Button } from 'antd';

export default function Tree() {
  const [refreshRate, setRefreshRate] = useState(1000)

  const onRefreshUpdate = (v) => {
    setRefreshRate(v)
  }

  return (
    <div>
      <PageHeader title="Process Manager - Applications" />
      <main>
        <ViewHeader onChange={onRefreshUpdate}>
            <Button size="small">Open</Button>
            <Button size="small">Launch</Button>
        </ViewHeader>
        <ProcessTree pollRate={refreshRate}/>
      </main>
    </div>
  )
}
