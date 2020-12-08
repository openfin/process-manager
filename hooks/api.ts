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

export const getProcessTree = async ():Promise<ProcessModel> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getProcessTree();
    }
    const procs = await finAPI.getProcessTree();
    return transformPSTree(procs);
}

export const getPIDEntities = async (pid:number):Promise<EntityProcessDetails[]> => {
    if (typeof fin === 'undefined') {
        return fauxAPI.getPIDEntities(pid);
    }
    return finAPI.getPIDEntities(pid);
}

// map between internal and exported interfaces
const transformPSTree = async (procTree:finAPI.appProcessTree[]):Promise<ProcessModel> => {
    let i = 0;
    const newTree = procTree.map( a => {
        let pid = a.processDetails ? a.processDetails.pid : 0;
        const appModel:AppProcessModel  = Object.assign({}, a, { 
            children: [], 
            key: `${i++}`,
            processInfo: {
                pid: pid,
            },
        });
        let j = 0;
        appModel.children = a.windows.map( w => {
            pid = w.processDetails ? w.processDetails.pid : 0;
            const winModel:WinProcessModel  = Object.assign({}, w, { 
                children: [], 
                key: `${i}_${j++}`,
                processInfo: {
                    pid: pid,
                },
            });
            let k = 0;
            winModel.children = w.views.map( v => {
                pid = v.processDetails ? v.processDetails.pid : 0;
                const viewModel:ViewProcessModel  = Object.assign({}, v, { 
                    key: `${i}_${j}_${k++}`, 
                    processInfo: {
                        pid: pid,
                    },
                });
                delete viewModel['processDetails'];
                return viewModel;
            })
            delete winModel['views'];
            delete winModel['processDetails'];
            return winModel;
        })
        delete appModel['windows'];
        delete appModel['processDetails'];
        return appModel;
    });
    return { applications: newTree }
}

