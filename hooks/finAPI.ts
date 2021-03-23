import { formatBytes, url2AppName, url2AppUUID, getRandomFillColor } from './utils'
import { EntityType, AppProcessModel, WinProcessModel, ViewProcessModel, WorkspaceItem } from './api'

import { WindowInfo, WorkspaceInfo, Monitor } from './api'

const MIN_API_VER = 55;

export default {
    getCurrentUUID: async() =>{
        return getUUID();
    },
    getRVMVersion: async () => {
        const rvmInfo = await fin.System.getRvmInfo();
        return rvmInfo.version;
    },
    showDeveloperTools: async (id:OpenFin.Identity, entityType: EntityType) => {
        return fin.System.showDeveloperTools(id);
    },
    closeItem: async (id:OpenFin.Identity, entityType: EntityType) => {
        if (entityType === EntityType.View) {
            // const v = await fin.View.wrap({uuid: id.uuid, name: id.name});
            // v.close();
        } else if (entityType === EntityType.Window) {
            const w = await fin.Window.wrap({uuid: id.uuid, name: id.name});
            w.close();
        } else {
            const app = await fin.Application.wrap(id);
            app.quit();
        }
    },
    getItemInfo: async (id:OpenFin.Identity, entityType: EntityType) => {
        if (entityType === EntityType.View) {
            const v = await fin.View.wrap({uuid: id.uuid, name: id.name});
            const info = await v.getInfo();
            const opts = await v.getOptions();
            return { info, options: opts };
        } else if (entityType === EntityType.Window) {
            const win = await fin.Window.wrap({uuid: id.uuid, name: id.name});
            const info = await win.getInfo();
            const opts = await win.getOptions();
            return { info, options: opts };
        } else {
            const app = await fin.Application.wrap(id);
            const appInfo = await app.getInfo();
            delete appInfo.manifestUrl;
            return appInfo;
        }
    },
    rescueWindow: async (id:OpenFin.Identity) => {
        const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
        ofwin.moveTo(100, 100);
        ofwin.focus();
        ofwin.bringToFront();    
    },
    toggleWindowVisibility: async (id:OpenFin.Identity, visible:boolean) => {
        if (visible) {
            const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
            ofwin.hide();
        } else {
            const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
            ofwin.show();
            ofwin.focus();
            ofwin.bringToFront();
        }    
    },
    getProcessTree: async() => {
        const allApps = await fin.System.getAllApplications();
        let appsModel = await Promise.all(allApps.map(async (a) => {
            const app = await fin.Application.wrap({uuid: a.uuid});
            const info = await app.getInfo();
            const runtimeVersion = info.runtime["version"];
            const apiVersion = parseInt(runtimeVersion.split('.')[2]);
            const wins = await getAppWindows(app);
            const an:AppProcessModel = {
                identity: {...app.identity, name: app.identity.uuid },
                entityType: EntityType.Application,
                url: info.manifestUrl,
                title: app.identity.uuid,
                key: app.identity.uuid,
                runtimeVersion,
                isPlatform: info.initialOptions["isPlatformController"],
                isRunning: a.isRunning,
                isLegacy: apiVersion < MIN_API_VER,
                icon: info.initialOptions["applicationIcon"],
                children: wins,
            };
            return an;
        }));
        appsModel = appsModel.sort(titleUUIDSorter)
        return {
            applications: appsModel
        }
    },
    getAppProcesses: async (uuid: string):Promise<any[]> => {
        const app = await fin.Application.wrap({uuid});
        const pinfo = await app.getProcessInfo();
        if (pinfo.entities) {
            return pinfo.entities.map( (i) => {
                console.log(i);
                return Object.assign(i, { key: i.url})
            });
        }
        return pinfo.entities;
    },
    closeAllApplications: async () => {
        const myUUID = getUUID();
        const procInfo = await fin.System.getAllProcessInfo();
        await Promise.all(procInfo.apps.map( async p => {
            if (p.uuid !== myUUID) {
                const app = await fin.Application.wrap({ uuid: p.uuid});
                app.quit(true);
            }
        }))
    },
    launchApplication: async ({manifestURL, applicationURL }) => {
        if ( manifestURL !== '' ) {
            fin.Application.startFromManifest(manifestURL);
        } else if ( applicationURL !== '' ) {
            const appUUID = url2AppUUID(applicationURL);
            const opts = Object.assign({}, defaultAppOptions, {
                name: url2AppName(applicationURL), 
                uuid: appUUID, url: applicationURL, 
                mainWindowOptions: {
                     name: appUUID,
                },
            });
            fin.Application.start(opts);
        } else {
            throw new Error('invalid arguments, must supply manifest or application url')
        }
    },
    getLogs: async ():Promise<any[]> => {
        const logs = await fin.System.getLogList();
        const dateOpts = {year: 'numeric', month: '2-digit', day: '2-digit'};
        const timeOpts = {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'};
        return logs.map((l, i) => {
            const logDate = new Date(Date.parse(l.date || ''));
            const logSize = l.size || 0;
            const newInfo = {
                key: `log_${i}`,
                fileName: l.name || '',
                size: logSize,
                formattedSize: formatBytes(logSize, 1),
                date: logDate,
                formattedDate: logDate.toLocaleDateString('en-US', dateOpts) + ' ' + logDate.toLocaleTimeString('en-US', timeOpts)
            };
            return newInfo;        
        });
    },
    copyLogPath: (l) => {
        navigator.clipboard.writeText(l.fileName)
    },
    getWorkspaceItems: async (brightness:number):Promise<WorkspaceItem[]> => {
        const winList:WorkspaceItem[] = [];
        const list = await fin.System.getAllWindows();
        const allWins = list.map(w => [w.mainWindow!].concat(w.childWindows!).map(cw => 
            Object.assign(cw, {
                uuid: w.uuid!,
                parentName: '',
                parentUUID: '',
                color: getRandomFillColor(w.uuid!, cw.name!, brightness),
                area: 0,
                showing: false
            }))
        ).reduce( (p,c) => p.concat(c), []);
        for (const w of allWins) {
            const fInfo = await fin.Frame.wrapSync({uuid: w.uuid!, name: w.name!}).getInfo()
            w.parentName = fInfo.parent.name||'';
            w.parentUUID = fInfo.parent.uuid;
            const ofWin = await fin.Window.wrap(w);
            const info = await ofWin.getInfo();
            w.showing = await ofWin.isShowing();
            w.area = calcWindowArea(w);
            winList.push(w);
        }
        return winList;
    },
    getWorkspaceInfo: async (): Promise<WorkspaceInfo> => {
        const monInfo = await fin.System.getMonitorInfo();
        const mons = getAllMonitors(monInfo);
        return {
            virtualTop: monInfo.virtualScreen.top,
            virtualLeft: monInfo.virtualScreen.left,
            virtualHeight: monInfo.virtualScreen.bottom - monInfo.virtualScreen.top, 
            virtualWidth: monInfo.virtualScreen.right - monInfo.virtualScreen.left,
            monitors: mons
        };
    }
}

export interface appNode extends processNode {
    description?: string;
    company?: string
    isPlatform: boolean;
    isRunning: boolean;
    isLegacy: boolean;
    icon: string;
    runtimeVersion: string;
    windows: winNode[];
}

export interface winNode extends processNode {
    visible: boolean;
    views: viewNode[];
}

export interface viewNode extends processNode {
    visible: boolean;
}

interface processNode {
    identity: OpenFin.Identity;
    entityType: EntityType;
    title: string;
    url: string;
}

const getUUID = () => {
    return fin.Application.getCurrentSync().identity.uuid
}

const defaultAppOptions = {
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

const getAppWindows = async (app: OpenFin.Application): Promise<WinProcessModel[]> => {
    const mWin = await app.getWindow();
    const winList:OpenFin.Window[] = await app.getChildWindows();
    winList.push(mWin);

    let winModels = await Promise.all(winList.map(async (w) => {
        const key = `${app.identity.uuid}_${w.identity.name}`;
        const views = await getWindowViews(w, key);
        const winfo = await w.getInfo();
        const isShowing = await w.isShowing();
        return {
            identity: {...w.identity },
            entityType: EntityType.Window,
            title: winfo.title,
            url: winfo.url,
            visible: isShowing,
            views: views,
            key: key
        };
    }));
    winModels = winModels.sort(titleSorter);
    return winModels;
}

const getWindowViews = async (win:OpenFin.Window, parentKey: string): Promise<ViewProcessModel[]> => {
    const views = await win.getCurrentViews();
    let viewModels = await Promise.all(views.map(async(v) => {
        const info = await v.getInfo();
        return {
            identity: {...v.identity },
            entityType: EntityType.View,
            title: info.title,
            url: info.url,
            visible: true,
            key: `${parentKey}_${v.identity.uuid}`
        };
    }));
    viewModels = viewModels.sort(titleSorter);
    return viewModels;
};

const stringCompare = (a, b) => {
    return a.localeCompare(b);
}

const titleSorter = (a, b) => {
    return stringCompare(a.title, b.title);
}

const titleUUIDSorter = (a, b) => {
    return stringCompare(a.title || a.identity.uuid, b.title || b.identity.uuid);
}

const calcWindowArea = (win:WindowInfo) => {
    return (win.right! - win.left!)*(win.bottom! - win.top!);
}

const getAllMonitors = (mons: OpenFin.MonitorInfo): Monitor[] => {
    const infos:Monitor[] = [];
    const pInfo = mons.primaryMonitor.monitorRect;
    infos[0] = { "top": pInfo.top, left: pInfo.left, bottom: pInfo.bottom, right: pInfo.right, name: 'Main Monitor'};
    for (let i=0; i<mons.nonPrimaryMonitors.length; i++) {
        const nonPInfo = mons.nonPrimaryMonitors[i].monitorRect;
        infos[infos.length] = { "top": nonPInfo.top, left: nonPInfo.left, bottom: nonPInfo.bottom, right: nonPInfo.right, name: `Monitor ${i+1}`};
    }
    return infos;
}

