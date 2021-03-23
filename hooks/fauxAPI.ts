import { ProcessModel, WorkspaceInfo, EntityType, WorkspaceItem } from "./api";


export default {
    getCurrentUUID: async() =>{
        return 'me';
    },
    getRVMVersion: async () => {
        return '0.0.0'
    },
    showDeveloperTools: async (id:OpenFin.Identity) => {
        console.log('noop showDeveloperTools', id);
    },
    closeItem: async (id:OpenFin.Identity) => {
        console.log('noop closeItem', id);
    },
    getItemInfo: async (id:OpenFin.Identity, entityType: EntityType) => {
        return itemInfo
    },
    rescueWindow: async (id:OpenFin.Identity) => {
        console.log('noop rescueWindow', id);
    },
    toggleWindowVisibility: async (id:OpenFin.Identity, visible:boolean) => {
        console.log('noop toggleWindowVisibility', id);
    },
    getProcessTree: async ():Promise<ProcessModel> => {
        return { 
            applications: [
                {
                    key: '1',
                    url: 'https://home.openfin.co/app.json',
                    identity: { uuid: 'home-platform', name: 'Home Platform' },
                    entityType: EntityType.Application,
                    description: 'home platform oh yeah',
                    company: 'OpenFin Inc.',
                    isPlatform: true,
                    icon: '',
                    title: 'Home Platform',
                    runtimeVersion: 'canary',
                    isLegacy: false,
                    isRunning: true,
                    children: [
                        {
                            key: '11',
                            identity: { uuid: 'home-platform', name: 'Platform Window 1' },
                            entityType: EntityType.Window,
                            title: 'Window 1-1',
                            url: 'https://home.openfin.co/platform/window.html',
                            visible: false,
                        },
                        {
                            key: '12',
                            identity: { uuid: 'home-platform', name: 'Platform Window 2' },
                            entityType: EntityType.Window,
                            url: 'https://home.openfin.co/platform/window.html',
                            title: 'Window 1-2',
                            visible: true,
                            children: [
                                {
                                    key: '121',
                                    identity: { uuid: 'home-platform', name: 'View 1-2-1' },
                                    entityType: EntityType.View,
                                    title: 'View 1-2-1',
                                    url: 'https://mail.google.com/',
                                }
                            ]
                        },
                        {
                            key: '13',
                            identity: { uuid: 'home-platform', name: 'Platform Window 3' },
                            entityType: EntityType.Window,
                            title: 'Window 1-3',
                            url: 'https://home.openfin.co/platform/window.html',
                            visible: true,
                            children: [
                                {
                                    key: '131',
                                    identity: { uuid: 'home-platform', name: 'View 1-3-1' },
                                    entityType: EntityType.View,
                                    title: 'View 1-3-1',
                                    url: 'https://cnn.com/',
                                },
                                {
                                    key: '132',
                                    identity: { uuid: 'home-platform', name: 'View 1-3-2' },
                                    entityType: EntityType.View,
                                    title: 'View 1-3-2',
                                    url: 'https://fox.com/',
                                },
                                {
                                    key: '133',
                                    identity: { uuid: 'home-platform', name: 'View 1-3-3' },
                                    entityType: EntityType.View,
                                    title: 'View 1-3-3',
                                    url: 'https://bbc.com/',
                                }
                            ]
                        }
                    ]
                },
                {
                    key: '2',
                    identity: { uuid: 'process-manager', name: 'Process Manager' },
                    entityType: EntityType.Application,
                    url: 'https://pm.openfin.co/app.json',
                    description: 'Process Manager - An OpenFin Debugging and Diagnostic Tool',
                    company: 'OpenFin Inc.',
                    isPlatform: false,
                    isLegacy: false,
                    icon: '',
                    title: 'Process Manager',
                    runtimeVersion: 'stable',
                    isRunning: true,
                    children: [
                        {
                            key: '21',
                            identity: { uuid: 'process-manager', name: 'Process Manager' },
                            entityType: EntityType.Window,
                            title: 'main-window',
                            url: 'https://pm.openfin.co/',
                            visible: true,
                        },
                    ]
                },
            ]
        };
    },
    getAppProcesses: async (uuid: string):Promise<any[]> => {
        return [
            {
                key: 1,
                pid: 12345,
                entityType: 'window',
                url: 'https://some.shit.url/fake/path',
                cpuUsage: 50,
                privateSetSize: 876678879
            },
            {
                key: 2,
                pid: 54321,
                entityType: 'window',
                url: 'https://some.shit.url/fake/path',
                cpuUsage: 13,
                privateSetSize: 9267345
            }
        ];
    },
    closeAllApplications: async () => {
        console.log('noop closeAllApplications');
    },
    launchApplication: async ({manifestURL, applicationURL }) => {
        console.log('noop closeAllApplications', manifestURL, applicationURL);
    },
    getLogs: async ():Promise<any[]> => {
        return [
            {
                key: "debug.log",
                fileName: "debug.log",
                formattedDate: "12/14/2020 15:18:05",
                formattedSize: "7.4KB",
                size: 7620
            }
        ];
    },
    copyLogPath: (l): void => {
        console.log('noop copyLogPath', l);
        navigator.clipboard.writeText('fake log path')
    },
    getWorkspaceItems: async (brightness:number):Promise<WorkspaceItem[]> => {
        const item:WorkspaceItem = {
            area: 851040,
            bottom: 816,
            color: "#b5acd6",
            height: 720,
            isShowing: true,
            left: 165,
            name: "process-manager",
            parentName: "",
            parentUUID: "",
            right: 1347,
            showing: true,
            state: "normal",
            top: 96,
            uuid: "process-manager",
            width: 1182
        }
        return [
            item
        ];
    },
    getWorkspaceInfo: async (): Promise<WorkspaceInfo> => {
        return {
            virtualLeft: 0,
            virtualTop: 0,
            virtualWidth: 1440,
            virtualHeight: 900,
            monitors: [
                {
                    bottom: 900,
                    left: 0,
                    right: 1440,
                    top: 0,
                    name: "Main Monitor"
                }
            ]
        }
    }
}

const itemInfo = {
    default_icon: "default_icon.png",
    licenseKey: "64605fac-add3-48a0-8710-64b38e96a2dd",
    devtools_port: 9090,
    websocket_port: 9696,
    logging: true,
    startup_app: {
        name: "process-manager",
        version: "1.7.3",
        description: "Process Manager",
        url: "https://cdn.openfin.co/process-manager/index.html",
        uuid: "process-manager",
        defaultHeight: 800,
        defaultWidth: 600,
        applicationIcon: "https://cdn.openfin.co/process-manager/img/proc-mgr-icon.png",
        company: "OpenFin",
        autoShow: true
    },
    runtime: {
        arguments: "",
        version: "stable"
    },
    splashScreenImage: "https://cdn.openfin.co/process-manager/img/proc-mgr-splash.png",
    shortcut: {
        company: "OpenFin",
        description: "OpenFin Process Manager",
        icon: "https://cdn.openfin.co/process-manager/img/proc-mgr-icon.ico",
        name: "Process Manager"
    }
};
