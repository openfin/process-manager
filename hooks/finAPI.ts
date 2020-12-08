import { Identity } from "openfin-adapter";
import { _Window } from "openfin-adapter/src/api/window";
import { AppProcessInfo, EntityProcessDetails } from 'openfin-adapter/src/shapes/process_info'

const MIN_API_VER = 55;

export const rvmInfo = async () => {
    return fin.System.getRvmInfo();
}

export const showDeveloperTools = async (id:Identity) => {
    return fin.System.showDeveloperTools(id);
}

export const closeItem = async (id:Identity) => {
    if (id.entityType === 'view') {
        // const v = await fin.View.wrap({uuid: id.uuid, name: id.name});
        // v.close();
    } else if (id.entityType === 'window') {
        const w = await fin.Window.wrap({uuid: id.uuid, name: id.name});
        w.close();
    } else {
        const app = await fin.Application.wrap(id);
        app.close();
    }
}

export const getItemInfo = async (id:Identity) => {
    if (id.entityType === 'view') {
        const v = await fin.View.wrap({uuid: id.uuid, name: id.name});
        const info = await v.getInfo();
        const opts = await v.getOptions();
        return { info, options: opts };
    } else if (id.entityType === 'window') {
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
}

export const rescueWindow = async (id:Identity) => {
    if (id.entityType === 'window') {
        const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
        ofwin.moveTo(100, 100);
        ofwin.focus();
        ofwin.bringToFront();    
    }
}

export const toggleWindowVisibility = async (id:Identity, visible:boolean) => {
    if (id.entityType === 'window') {
        if (visible) {
            const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
            ofwin.hide();
        } else {
            const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
            ofwin.show();
            ofwin.focus();
            ofwin.bringToFront();
        }    
    }
}

export interface appProcessTree extends processTree {
    description?: string;
    company?: string
    isPlatform: boolean;
    isRunning: boolean;
    icon: string;
    runtimeVersion: string;
    windows: winProcessTree[];
}

export interface winProcessTree extends processTree {
    visible: boolean;
    views: viewProcessTree[];
}

export interface viewProcessTree extends processTree {
    visible: boolean;
}

interface processTree {
    identity: Identity;
    title: string;
    url: string;
    processDetails: EntityProcessDetails;
}

export const getProcessTree = async():Promise<appProcessTree[]> => {

    async function getWindowPSList (winList:_Window[], psInfo:AppProcessInfo): Promise<winProcessTree[]> {
        return await Promise.all(winList.map(async (w) => {
            const ps = psInfo.entities.find(i => i.name === w.identity.name);
            const views = await getViewList(w, psInfo);
            const winfo = await w.getInfo();
            const isShowing = await w.isShowing();
            return Object.assign(w, { 
                identity: {...w.identity, entityType: 'window' },
                title: winfo.title,
                url: winfo.url,
                processDetails: ps, 
                visible: isShowing, 
                views: views,
            });
        }));
    }

    async function getViewList (win:_Window, psInfo:AppProcessInfo): Promise<viewProcessTree[]> {
        const views = await win.getCurrentViews();
        return await Promise.all(views.map(async(v) => {
            const ps = psInfo.entities.find(i => i.name === v.identity.name);
            const info = await v.getInfo();
            return Object.assign(v, {
                identity: {...v.identity, entityType: 'view' },
                title: info.title,
                url: info.url,
                processDetails: ps,
                visible: true,
            });
        }));
    };

    return await Promise.all((await fin.System.getAllApplications()).map(async (a) => {
        const app = fin.Application.wrapSync(a);
        const info = await app.getInfo();
        const running = await app.isRunning();
        const winList = await app.getChildWindows();
        const mainWin = await app.getWindow();
        winList.push(mainWin);
        const runtimeVersion = info.runtime["version"];
        const apiVersion = parseInt(runtimeVersion.split('.')[2]);
        
        let psInfo: AppProcessInfo = { uuid: '', entities: []}, mainWinPSDetails:EntityProcessDetails = null;
        if (apiVersion >= MIN_API_VER) {
            psInfo = await app.getProcessInfo();
            mainWinPSDetails = psInfo.entities.find(epd => epd.name === mainWin.identity.name)
        }

        const applicationProcessInfo: appProcessTree = {
            identity: {...app.identity, entityType: 'application'},
            url: info.manifestUrl,
            title: app.identity.uuid || mainWin.identity.uuid || mainWin.identity.name,
            runtimeVersion,
            isPlatform: info.initialOptions["isPlatformController"],
            isRunning: running,
            icon: info.initialOptions["applicationIcon"],
            processDetails: mainWinPSDetails,
            windows: await getWindowPSList(winList, psInfo),
        };

        if (info.manifest && info.manifest["shortcut"]) {
            const manifest: any = info.manifest;
            applicationProcessInfo.title = manifest.shortcut.name;
            applicationProcessInfo.description = manifest.shortcut.description;
            applicationProcessInfo.company = manifest.shortcut.company;
        }

        return applicationProcessInfo;

    }));
}

export const getPIDEntities = async (pid: number):Promise<EntityProcessDetails[]> => {
    return [];
}