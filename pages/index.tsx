import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { Tabs } from 'antd';
import { RVMInfo } from '../components/rvmInfo'
import { ProcessTree }  from '../components/processTree'

const TabPane = Tabs.TabPane;

export default function Home() {
  const info = <RVMInfo/>

  const [selectedTab, setSelectedTab] = useState("1")
  
  const onTabChange = (key) => {
    setSelectedTab(key);
  }

  return (
    <div>
      <PageHeader title="Process Manager" />
      <main>
        <Tabs tabBarExtraContent={info} onChange={onTabChange} type="card">
            <TabPane tab="Applications" key="1"><ProcessTree pollForData={selectedTab === "1"} /></TabPane>
            <TabPane tab="Screens" key="2">COLORED BLOCKS</TabPane>
        </Tabs>
      </main>
    </div>
  )
}
