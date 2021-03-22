import { useState } from 'react';
import { PageHeader } from '../components/pageHeader'
import { Tabs, Menu, Dropdown, Button, Modal, Form, Input } from 'antd';
import { RocketOutlined, DeleteOutlined, SettingOutlined, InfoCircleOutlined} from '@ant-design/icons';
import { RVMInfo } from '../components/rvmInfo'
import { ProcessTree } from '../components/processTree'
import { Workspace } from '../components/workspace'
import { LogList } from '../components/logList'
import getAPI from '../hooks/api';

export default function Home() {
    const defaultTab = "1";

    const statusGood = '';
    const statusError = 'error';

    const [selectedTab, setSelectedTab] = useState(defaultTab)
    const [appModalVisible, setAppModalVisible] = useState(false)
    const [formStatus, setFormStatus] = useState(statusGood)
    const [errorMSG, setErrorMSG] = useState('')

    const resetForm = () => {
        setFormStatus('')
        setErrorMSG('')
    }

    const getValidationStatus = (): '' | 'error' | 'success' | 'warning' | 'validating' => {
        return formStatus === statusError ? statusError : statusGood;
    }

    const openAppModal = () => {
        setAppModalVisible(true)
        resetForm()
    }

    const closeAppModal = () => {
        setAppModalVisible(false)
    }

    const onTabChange = (key:string) => {
        setSelectedTab(key);
    }

    const onFormInputChange = () => {
        resetForm()
    }

    const closeAllApps = () => {
        Modal.confirm({
            title: 'Close ALL Applications?',
            content: 'Click OK to close ALL running applications.',
            onOk() {
                getAPI().closeAllApplications();
            },
            onCancel() {},
        });
    }

    const openApplication = async () => {
        const manifURL = (document.getElementById('appManifestUrl') as HTMLInputElement).value;
        const siteURL = (document.getElementById('appSiteUrl') as HTMLInputElement).value;
        if (manifURL !== '' || siteURL !== '') {
            try {
                await getAPI().launchApplication({ manifestURL: manifURL, applicationURL: siteURL})
                closeAppModal();
            } catch(e) {
                setErrorMSG(e.message)
            }
        } else {
            setFormStatus('error')
        }
    }

    return (
        <div>
            <PageHeader title="Process Manager" />
            <main>
                <Tabs activeKey={selectedTab} tabBarExtraContent={
                        <div id="tabExtras">
                            {selectedTab === "1" ?
                            <Dropdown overlay={
                                <Menu>
                                    <Menu.Item key="0">
                                        <a onClick={openAppModal}><RocketOutlined /> Launch Application</a>
                                    </Menu.Item>
                                    <Menu.Item key="1">
                                        <a onClick={closeAllApps}><DeleteOutlined /> Close All Applications</a>
                                    </Menu.Item>
                                </Menu>
                            } trigger={['click']}>
                                <Button href="" type="default" icon={<SettingOutlined />}></Button>
                            </Dropdown> : <div/>}
                            <RVMInfo />
                        </div>
                    } onChange={onTabChange} type="card" destroyInactiveTabPane={true} >
                    <Tabs.TabPane tab="Applications" key="1">
                        <ProcessTree pollRate="1000" />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Workspace" key="2">
                        <Workspace pollRate="1000" brightness={150} headerHeight={68} initialWidth={800} initialHeight={600} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Logs" key="3">
                        <LogList pollRate="1000" />
                    </Tabs.TabPane>
                </Tabs>
                <Modal title="Open Application" visible={appModalVisible} onOk={openApplication} onCancel={closeAppModal} okText="Open" cancelText="Cancel">
                    <p>
                        Enter an application manifest below, if you do not have a manifest/config, 
                        simply enter the application's main URL.
                    </p>
                    <p className="error">
                        {errorMSG}
                    </p>
                    <Form id="appLaunchForm" layout="vertical">
                        <Form.Item label="Manifest URL" validateStatus={getValidationStatus()} tooltip={{ title: 'Enter your applications manifest url here', icon: <InfoCircleOutlined /> }}>
                            <Input id="appManifestUrl" onChange={onFormInputChange} placeholder="https://my.application.com/app.json" allowClear />
                        </Form.Item>
                        <Form.Item label="Application URL" validateStatus={getValidationStatus()} tooltip={{ title: 'Enter the main url to your application here', icon: <InfoCircleOutlined /> }}>
                            <Input id="appSiteUrl" onChange={onFormInputChange} placeholder="https://my.application.com/" allowClear />
                        </Form.Item>
                    </Form>
                </Modal>
            </main>
        </div>
    )
}
