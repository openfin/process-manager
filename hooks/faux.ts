export const rvmInfo = () => {
    return { version: '0.0.0' }
}

export const desktopWindows = () => {
    return [];
}

export const pidMembers = () => {
    return [
        {
            key: 1,
            uuid: 'asdf',
            url: 'https://some.shit.url/fake/path',
            cpu: 0,
            mem: 876678879
        },
        {
            key: 2,
            uuid: 'fdsa',
            url: 'https://some.shit.url/fake/path',
            cpu: 0,
            mem: 9267345
        }
    ];
}

export const processTree = () => {
    return [
        {
            key: 1,
            name: 'Home Platform',
            url: 'https://home.openfin.co/',
            manifest: 'https://home.openfin.co/app.json',
            pid: 67839,
            type: 'app',
            children: [
                {
                    key: 11,
                    name: 'Window 1-1',
                    url: 'https://home.openfin.co/platform/window.html',
                    pid: 67840,
                    visible: false,
                    type: 'window',
                },
                {
                    key: 12,
                    name: 'Window 1-2',
                    url: 'https://home.openfin.co/platform/window.html',
                    pid: 67839,
                    visible: true,
                    type: 'window',
                    children: [
                        {
                            key: 121,
                            name: 'View 1-2-1',
                            url: 'https://mail.google.com/',
                            pid: 67840,
                            type: 'view',
                        }
                    ]
                },
                {
                    key: 13,
                    name: 'Window 1-3',
                    url: 'https://home.openfin.co/platform/window.html',
                    pid: 67841,
                    visible: true,
                    type: 'window',
                    children: [
                        {
                            key: 131,
                            name: 'View 1-3-1',
                            url: 'https://cnn.com/',
                            pid: 67840,
                            type: 'view',
                        },
                        {
                            key: 132,
                            name: 'View 1-3-2',
                            url: 'https://fox.com/',
                            pid: 67840,
                            type: 'view',
                        },
                        {
                            key: 133,
                            name: 'View 1-3-3',
                            url: 'https://bbc.com/',
                            pid: 67840,
                            type: 'view',
                        }
                    ]
                }
            ]
        },
        {
            key: 2,
            name: 'Process Manager',
            url: 'https://pm.openfin.co/',
            manifest: 'https://pm.openfin.co/app.json',
            pid: 67838,
            type: 'app',
            children: [
                {
                    key: 11,
                    name: 'Window 1-1',
                    url: 'https://pm.openfin.co/',
                    pid: 67840,
                    visible: true,
                    type: 'window',
                },
            ]
        },
    ];
}

export const getItemInfo = () => {
    return {
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
}
