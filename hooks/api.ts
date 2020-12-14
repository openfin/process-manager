import { Identity } from 'openfin-adapter';
import { EntityProcessDetails } from 'openfin-adapter/src/shapes/process_info'

import * as fauxAPI from './fauxAPI';
import * as finAPI from './finAPI';

// get the RVM info (mocked)
export const getRVMInfo = async () => {
    if (typeof fin === 'undefined') {
        return fauxAPI.rvmInfo();
    }
    return finAPI.rvmInfo()
}

// show dev tools for the app/win/view
export const showDeveloperTools = (id:Identity) => {
    if (typeof fin === 'undefined') {
        return fauxAPI.showDeveloperTools(id);
    }
    finAPI.showDeveloperTools(id);
}

// close the app/window/view
export const closeItem = async (id:Identity) => {
    if (typeof fin === 'undefined') {
        return fauxAPI.closeItem(id);
    }
    return finAPI.closeItem(id);
}

// get info for the app/window/view (mocked)
export const getItemInfo = async (id:Identity):Promise<any> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getItemInfo(id);
    }
    return finAPI.getItemInfo(id);
}

// move a window (that may be offscreen) to 100x100
export const rescueWindow = async (id:Identity) => {
    if (typeof fin === 'undefined') {
        return fauxAPI.rescueWindow(id);
    }
    return finAPI.rescueWindow(id);
}

// toggle a window's visibility 
export const toggleWindowVisibility = async (id:Identity, visible:boolean) => {
    if (typeof fin === 'undefined') {
        return fauxAPI.toggleWindowVisibility(id, visible);
    }
    return finAPI.toggleWindowVisibility(id, visible);
}

// full process tree model
export interface ProcessModel {
    applications: AppProcessModel[];
}
export interface AppProcessModel extends BaseProcessModel {
    isRunning: boolean;
    isPlatform: boolean;
    runtimeVersion: string;
    company?: string;
    icon?: string;
    children: WinProcessModel[];
}
export interface WinProcessModel extends BaseProcessModel {
    visible: boolean;
    children?: ViewProcessModel[];
}
export interface ViewProcessModel extends BaseProcessModel {}
export interface BaseProcessModel {
    identity: Identity;
    title: string;
    description?: string;
    url: string;
    key: string;
    processInfo: ProcessInfo;
}
export interface ProcessInfo {
    pid: number;
}

// get a full process tree of all running applications
export const getProcessTree = async ():Promise<ProcessModel> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getProcessTree();
    }
    const procs = await finAPI.getProcessTree();
    return transformPSTree(procs);
}

// get a list of entities for a single PID
export const getPIDEntities = async (pid:number):Promise<EntityProcessDetails[]> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getPIDEntities(pid);
    }
    return finAPI.getPIDEntities(pid);
}

// close all applications - needs more testing to be used within platforms
export const closeAllApplications = async () => {
    if (typeof fin === 'undefined') {
        return fauxAPI.closeAllApplications();
    }
    return finAPI.closeAllApplications();
}

// launch an application by manifest or site/app URL
export const launchApplication = async ({manifestURL, applicationURL }) => {
    if (typeof fin === 'undefined') {
        return fauxAPI.launchApplication({manifestURL, applicationURL });
    }
    return finAPI.launchApplication({manifestURL, applicationURL });
}

// get the list of log files
export const getLogs = async ():Promise<any[]> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getLogs();
    }
    return finAPI.getLogs();
}

// open a log file
export const openLog = async (l):Promise<void> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.openLog(l);
    }
    return finAPI.openLog(l);
}

// copy the path of a log file
export const copyLogPath = async (l):Promise<string> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.copyLogPath(l);
    }
    return finAPI.copyLogPath(l);
}

// get our current UUID
export const getCurrentUUID = () => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getCurrentUUID();
    }
    return finAPI.getCurrentUUID();
}

// map between internal and exported interfaces
const transformPSTree = async (procTree:finAPI.appProcessTree[]):Promise<ProcessModel> => {
    let newTree = procTree.map( a => {
        let pid = a.processDetails ? a.processDetails.pid : 0;
        const appModel:AppProcessModel  = Object.assign({}, a, { 
            children: [], 
            key: a.identity.uuid,
            processInfo: {
                pid: pid,
            },
        });
        let j = 0;
        appModel.children = a.windows.map( w => {
            pid = w.processDetails ? w.processDetails.pid : 0;
            const winModel:WinProcessModel  = Object.assign({}, w, { 
                key: `${a.identity.uuid}_${w.identity.name}`,
                processInfo: {
                    pid: pid,
                },
            });
            let k = 0;
            if (w.views && w.views.length > 0) {
                const winViews = w.views.map( v => {
                    pid = v.processDetails ? v.processDetails.pid : 0;
                    const viewModel:ViewProcessModel  = Object.assign({}, v, { 
                        key: `${a.identity.uuid}_${w.identity.name}_${v.identity.uuid}`, 
                        processInfo: {
                            pid: pid,
                        },
                    });
                    delete viewModel['processDetails'];
                    return viewModel;
                })
                winModel.children = winViews.sort((a, b) => {
                    return a.title.localeCompare(b.title);
                });
            }
            delete winModel['views'];
            delete winModel['processDetails'];
            return winModel;
        })
        delete appModel['windows'];
        delete appModel['processDetails'];
        appModel.children = appModel.children.sort((a, b) => {
            return a.title.localeCompare(b.title);
        });
        return appModel;
    });
    newTree = newTree.sort((a, b) => {
        if ( a.title && b.title ) {
            return a.title.localeCompare(b.title);
        } else {
            return a.identity.uuid.localeCompare(b.identity.uuid)
        }
    });
    return { applications: newTree }
}
