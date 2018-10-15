import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Tabs, Menu, Dropdown, Icon, Button, Modal } from 'antd';

import { ProcessList } from './ProcessList';
import { LogList } from './LogList';
import { ServiceList } from './ServiceList';
import { WindowList } from './WindowList';
import { Workspace } from './Workspace'

import 'antd/dist/antd.less';

/* tslint:disable-next-line */
const confirm = Modal.confirm;

interface AppProps {}

interface AppState {
    pollProcesses: boolean;
    pollLogs: boolean;
    pollServices: boolean;
    pollWindows: boolean;
    openAppModalVisible: boolean;
    contentHeight: number;
    contentWidth: number;
    rvmInfo: string;
    extras: React.ReactNode[];
    currentKey: string;
}

export class App extends React.Component<AppProps, {}> {

    defaultAppOptions = {
        "name" : "",
        "uuid": "",
        "url" : "",
        "mainWindowOptions" : {
            defaultHeight : 500,
            defaultWidth: 420,
            defaultTop: 120,
            defaultLeft: 120,
            saveWindowState: false,
            autoShow: true
        }
    };

    constructor(props) {
        super(props);
        this.state = {currentKey: "1", pollProcesses: true, contentHeight: 600, contentWidth: 800, rvmInfo: 'RVM v0.0.0', openAppModalVisible: false};
        fin.desktop.System.getRvmInfo( (info) => {
            this.setState({ rvmInfo: 'RVM: ' + info.version});
            this.setState({ extras: this.getExtras((this.state as AppState).currentKey)});
        });
    }

    componentDidMount() {
        const w = document.body.clientWidth;
        const h = document.body.clientHeight;
        this.setState({contentHeight: h-80, contentWidth: w-20, extras: this.getExtras((this.state as AppState).currentKey)});
        document.addEventListener('keyup', (e) => {
            if (e.keyCode === 27) {
                this.hideInfoWindows();
            }
        });
    }

    onTabChange(key) {
        this.hideInfoWindows();
        this.setState({
            pollProcesses: key === "1", 
            pollLogs: key === "2", 
            pollWindows: (key === "3" || key === "4"), 
            pollServices: key === "5",
            currentKey: key,
            extras: this.getExtras(key)
        });
    }

    render() {
        const TabPane = Tabs.TabPane;
        return <div>
            <Tabs tabBarExtraContent={(this.state as AppState).extras} onChange={this.onTabChange.bind(this)} type="card">
                <TabPane tab="Applications" key="1"><ProcessList polling={(this.state as AppState).pollProcesses}></ProcessList></TabPane>
                <TabPane tab="Logs" key="2"><LogList polling={(this.state as AppState).pollLogs}></LogList></TabPane>
                <TabPane tab="Windows" key="3"><WindowList polling={(this.state as AppState).pollWindows}></WindowList></TabPane>
                <TabPane tab="Workspace" key="4"><Workspace height={(this.state as AppState).contentHeight} width={(this.state as AppState).contentWidth} polling={(this.state as AppState).pollWindows}></Workspace></TabPane>
                <TabPane tab="Services" key="5"><ServiceList polling={(this.state as AppState).pollServices}></ServiceList></TabPane>
            </Tabs>
            <Modal title="Open Application" visible={(this.state as AppState).openAppModalVisible} onOk={() => this.openApplication()} onCancel={() => this.hideOpenAppModal()} okText="Open" cancelText="Cancel" >
                <p>
                    Enter an application manifest below, if you do not have a manifest/config, 
                    simply enter the application's main URL.
                </p>
                <p>
                    Manifest URL:<br/>
                    <input className="modalInput" id="appManifestUrl" type="text" placeholder="https://my.application.com/app.json" />
                </p>
                <p>
                    Site URL:<br/>
                    <input className="modalInput" id="appSiteUrl" type="text" placeholder="https://my.application.com/" />
                </p>
            </Modal>
        </div>;
    }

    showOpenAppModal() {
        this.setState({ openAppModalVisible: true });
    }
    
    openApplication() {
        const manifestURLElem = document.getElementById('appManifestUrl');
        const siteURLElem = document.getElementById('appSiteUrl');
        if (manifestURLElem && (manifestURLElem as HTMLInputElement).value !== '') {
            const manifestURL = (manifestURLElem as HTMLInputElement).value;
            console.log('launching app from manifest url: ' + manifestURL);
            fin.desktop.Application.createFromManifest(manifestURL, (app) => {
                app.run(console.log, console.log);
            }, (e) => console.log('error creating app from manifest: ' + e));
            this.hideOpenAppModal();
        } else if (siteURLElem && (siteURLElem as HTMLInputElement).value !== '') {
            const siteURL = (siteURLElem as HTMLInputElement).value;
            const opts = Object.assign({}, this.defaultAppOptions, {name: this.url2Name(siteURL), uuid: this.url2UUID(siteURL), url: siteURL});
            console.log('launching app from url (generated json): ' + siteURL + ', name: ' + opts.name + ', uuid: ' + opts.uuid);
            const newApp = new fin.desktop.Application(opts, () => console.log('app created from URL'), (e) => console.log('error creating app from URL: ' + e));
            newApp.run();
            this.hideOpenAppModal();
        } else {
            // TODO better error UI
            console.log('must enter a url');
        }
    }

    url2Name(name: string) {
        return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
    }

    url2UUID(name: string) {
        return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
    }
    
    hideOpenAppModal() {
        this.setState({ openAppModalVisible: false });
    }

    getExtras(key:string) {
        const defaultExtras = <span id="rvmInfo">{(this.state as AppState).rvmInfo}</span>
        if (key === "1") {
            const procMenu = <Menu>
                <Menu.Item key="0">
                    <a onClick={(e) => this.openApp()}><Icon type="rocket" /> Launch Application</a>
                </Menu.Item>
                <Menu.Item key="1">
                    <a onClick={(e) => this.closeAllApps()}><Icon type="delete" /> Close All Applications</a>
                </Menu.Item>
            </Menu>;
            return <div id="tabExtras">
                <Dropdown overlay={procMenu} trigger={['click']}>
                    <Button type="default" icon="setting"></Button>
                </Dropdown>
                {defaultExtras}
            </div>;
        }
        return <div id="tabExtras">{defaultExtras}</div>;
    }

    closeAllApps() {
        confirm({
            title: 'Close ALL Applications?',
            content: 'Click OK to close ALL running applications.',
            onOk() {
                ProcessList.closeAllApps();
            },
            onCancel() {},
        });
    }

    openApp() {
        this.showOpenAppModal();
    }

    hideInfoWindows() {
        const appInfoDiv = document.getElementById('appDetails');
        if (appInfoDiv) {
            appInfoDiv.classList.remove('showing');
        }
        const winInfoDiv = document.getElementById('winDetails');
        if (winInfoDiv) {
            winInfoDiv.classList.remove('showing');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    ReactDOM.render(<App></App>, document.getElementById('content'));

    // diagnostic events - console.log'ed for now
    fin.System.addListener('application-started', (evt) => {
        console.log(`application-started: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('monitor-info-changed', (evt) => {
        console.log(`monitor-info-changed: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('application-closed', (evt) => {
        console.log(`application-closed: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('window-created', (evt) => {
        console.log(`window-created: ${JSON.stringify(evt, null, 4)}`);
    });
});