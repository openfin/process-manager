import { Identity } from 'openfin-adapter';
import * as faux from './faux';

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export const formatBytes = (size:number, places: number) => {
    if (size > GB) {
        return (size / GB).toFixed(places) + 'GB';
    } else if (size > MB) {
        return (size / MB).toFixed(places) + 'MB';
    } else if (size > KB) {
        return (size / KB).toFixed(places) + 'KB';
    } else if (size === 0) {
        return '0';
    } else {
        return size.toFixed(1) + 'B';
    }
};

export const getRVMInfo = async () => {
    if (typeof fin === 'undefined') {
        return faux.rvmInfo();
    }
    const info = await fin.System.getRvmInfo();
    return info;
}

export const getProcessTree = async () => {
    if (typeof fin === 'undefined') {
        return faux.processTree();
    }
    return [];
}

export const getDesktopWindows = async () => {
    if (typeof fin === 'undefined') {
        return faux.desktopWindows();
    }
    return [];
}

export const getPIDMembers = async () => {
    if (typeof fin === 'undefined') {
        return faux.pidMembers();
    }
    return [];
}

export const showDeveloperTools = (id:Identity) => {
    if (typeof fin === 'undefined') {
        console.log('noop showDeveloperTools');
        return;
    }
    fin.System.showDeveloperTools(id);
}

export const closeItem = async (id:Identity) => {
    if (typeof fin === 'undefined') {
        console.log('noop closeItem');
        return;
    }
    if (id.entityType === 'view') {

    } else if (id.entityType === 'window') {
        const w = await fin.Window.wrap({uuid: id.uuid, name: id.name});
        w.close();
    } else {
        const app = await fin.Application.wrap(id);
        app.close();
    }
}

export const getItemInfo = async (id:Identity):Promise<any> => {
    if (typeof fin === 'undefined') {
        return faux.getItemInfo();
    }
    if (id.entityType === 'view') {
    } else if (id.entityType === 'window') {
    } else {
    }
}

export const rescueWindow = async (id:Identity) => {
    if (typeof fin === 'undefined') {
        console.log('noop rescueWindow');
        return;
    }
    const ofwin = await fin.Window.wrap({ uuid: id.uuid, name: id.name});
    ofwin.moveTo(100, 100);
    ofwin.focus();
    ofwin.bringToFront();
}

export const toggleWindowVisibility = async (id:Identity, visible:boolean) => {
    if (typeof fin === 'undefined') {
        console.log('noop toggleWindowVisibility');
        return;
    }
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