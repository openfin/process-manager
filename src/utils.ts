const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const MIN_API_VER = 55;

export interface ProcessDetails {
    cpuUsage: number;
    nonPagedPoolUsage: number;
    pageFaultCount: number;
    pagedPoolUsage: number;
    pagefileUsage: number;
    peakNonPagedPoolUsage: number;
    peakPagedPoolUsage: number;
    peakPagefileUsage: number;
    peakWorkingSetSize: number;
    workingSetSize: number;
    pid: number;
}

//TODO:
// Where I left off is that I want to make the process information version dependant (55 and higher) while leaving a lot of the actions available to all versions
// How I plan on doing that is:
// 1. Add process Info to application as a property
// 2. Extract relevant info to display from info and have process info as a seperate property.
// Type stuff so that it's easier.


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

export const getApplicationPSTree = async() => {

    async function getWindowPSList (winList, psInfo) {
        return await Promise.all(winList.map(async (w) => {
            const ps = psInfo.entities.find(i => i.name === w.identity.name);
            ps.views = await getViewList(w, psInfo);
            return ps;
        }));
    }

    async function getViewList (win, psInfo) {
        const views = await win.getCurrentViews();
        return await Promise.all(views.map(async(v) => {

            const ps = psInfo.entities.find(i => i.name === v.identity.name);
            return ps;
        }));
    };

    return await Promise.all((await fin.System.getAllApplications()).map(async (a) => {
        const app:any = fin.Application.wrapSync(a);
        const info = await app.getInfo();
        const winList = await app.getChildWindows();
        const runtimeVersion = info.runtime["version"];
        const apiVersion = runtimeVersion.split('.')[2];
        let psInfo: any;

        if (apiVersion >= MIN_API_VER) {
            psInfo = await app.getProcessInfo();
        }
        
        winList.push(await app.getWindow());

        const applicationProcessInfo: any = {
            identity: { uuid: info.initialOptions["uuid"] },
            printName: info.initialOptions["uuid"],
            description: "",
            company: "",
            runtimeVersion,
            isPlatform: info.initialOptions["isPlatformController"],
            icon: info.initialOptions["applicationIcon"],
            windows: await getWindowPSList(winList, psInfo)
        };

        if (info.manifest && info.manifest["shortcut"]) {
            const manifest: any = info.manifest;
            applicationProcessInfo.name = manifest.shortcut.name;
            applicationProcessInfo.description = manifest.shortcut.description;
            applicationProcessInfo.company = manifest.shortcut.company;
        }
        return applicationProcessInfo;

    }));
}
