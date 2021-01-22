import { WindowDetail } from 'openfin-adapter/src/api/system/window';

import fauxAPI from './fauxAPI';
import finAPI from './finAPI';

export interface procManAPI {
    // get this app's current UUID
    getCurrentUUID(): Promise<string>;
    // get the RVM version
    getRVMVersion(): Promise<string>
    // show dev tools for the app/win/view
    showDeveloperTools(id:OpenFin.Identity, entityType: EntityType): Promise<void>
    // close the app/window/view
    closeItem(id:OpenFin.Identity, entityType: EntityType): Promise<void>
    // get info for the app/window/view
    getItemInfo(id:OpenFin.Identity, entityType: EntityType): Promise<any>
    // move a window (that may be offscreen) to 100x100
    rescueWindow(id:OpenFin.Identity): Promise<void>
    // toggle a window's visibility 
    toggleWindowVisibility(id:OpenFin.Identity, visible:boolean): Promise<void>
    // get a full process tree of all running applications
    getProcessTree(): Promise<ProcessModel>
    // get a list of entities for a single PID
    getAppProcesses(uuid: string): Promise<any[]>
    // close all applications - needs more testing to be used within platforms
    closeAllApplications(): Promise<void>
    // launch an application by manifest or site/app URL
    launchApplication ({manifestURL, applicationURL }): Promise<void>
    // get the list of log files
    getLogs():Promise<any[]>
    // copy the path of a log file
    copyLogPath(l): void
    // ??????
    getWorkspaceItems(brightness:number): Promise<WorkspaceItem[]>
    // ??????
    getWorkspaceInfo(): Promise<WorkspaceInfo>
}

// full process tree model
export interface ProcessModel {
    applications: AppProcessModel[];
}

export interface AppProcessModel extends BaseProcessModel {
    isRunning: boolean;
    isPlatform: boolean;
    isLegacy: boolean;
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
    identity: OpenFin.Identity;
    entityType: EntityType;
    title: string;
    description?: string;
    url: string;
    key: string;
}

export enum EntityType {
    Application = "application",
    Window = "window",
    View = "view"
}

export interface WorkspaceItem extends WindowDetail {
    uuid: string;
    parentName: string;
    parentUUID: string;
    color: string;
    area: number;
    showing: boolean;
}

export interface WorkspaceInfo {
    virtualTop: number;
    virtualLeft: number;
    virtualHeight: number;
    virtualWidth: number;
    monitors: Monitor[];
}

export interface Monitor {
    top: number;
    left: number;
    bottom: number;
    right: number;
    name: string;
}

export interface WindowInfo extends WindowDetail {
    color: string;
    area: number;
    showing: boolean;
}

const api = ():procManAPI => {
    return (typeof fin === 'undefined') ? fauxAPI : finAPI;
}
export default api;
