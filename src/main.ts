interface AppInfo {
    runtime: AppVersion;
    manifestUrl: string;
    manifest: Manifest;
}
interface AppVersion {
    version: string;
}
interface Manifest {
    startup_app: StartUpApp;
}
interface StartUpApp {
    url: string;
}
interface LogFile {
    fileName: string;
    formattedDate: string;
    date: Date;
    size: number;
    formattedSize: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const SELECTED = 'selected';
    const tabs = document.querySelectorAll('#tab-bar li');
    const contents = document.querySelectorAll('#tab-contents .tab-content');

    const init = () => {
        // init the tabs
        initTabs();
        // processes (apps/services) tab content
        initProcessList();
        // processes (apps/services) tab
        initLogList();
    };

    // tab stuff

    const initTabs = () => {
        tabs[0].classList.add(SELECTED);
        contents[0].classList.add(SELECTED);

        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            tab.addEventListener('click', (e: Event) => {
                if (e.srcElement !== null) {
                    handleTabClick(e.srcElement as HTMLElement);
                }
            });
        }
    };

    const handleTabClick = (elem: HTMLElement) => {
        let id = elem.getAttribute('id');
        if (id) {
            // deslect everything
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove(SELECTED);
                contents[i].classList.remove(SELECTED);
            }
            elem.classList.add(SELECTED);
            id = id.replace('tab-', 'c-');
            const content = document.getElementById(id);
            if (content !== null) {
                content.classList.add(SELECTED);
            }
        }
    };

    // process list stuff

    const initProcessList = () => {
        writeProcessHeaders();
        updateProcessList();
        const refBtn = document.querySelector('#c-processes .refreshButton');
        if (refBtn) {
            refBtn.addEventListener('click', updateProcessList);
        }
    };

    const writeProcessHeaders = () => {
        const headElem = document.querySelector('#c-processes .thead');
        if (headElem !== null) {
            const row = createRow();
            row.appendChild(createCol('ID'));
            row.appendChild(createCol('Application'));
            row.appendChild(createCol('URL'));
            row.appendChild(createCol('Manifest'));
            row.appendChild(createCol('Runtime'));
            row.appendChild(createCol('Debug'));
            headElem.appendChild(row);
        }
    };

    const updateProcessList = () => {
        const procElem = document.querySelector('#c-processes .tbody');
        if (procElem !== null) {
            procElem.innerHTML = '';
            fin.desktop.System.getProcessList(async (list) => {
                for (let i = 0; i < list.length; i++) {
                    const proc = list[i];
                    const appInf = await new Promise((res, rej) => {
                        fin.desktop.Application.wrap(proc.uuid || '').getInfo(res, rej);
                    });

                    const row = createRow();
                    row.appendChild(createCol((proc.processId || -1).toString()));
                    row.appendChild(createCol(getAppNameUUID(proc), true));
                    row.appendChild(createCol(getAppURL(appInf as AppInfo), true));
                    row.appendChild(createCol(getManifest(appInf as AppInfo), true));
                    row.appendChild(createCol(getRuntimeVersion(appInf as AppInfo)));
                    row.appendChild(createDebugLauncherCol(proc, appInf as AppInfo));
                    procElem.appendChild(row);
                }
            });
        }
    };

    const initLogList = () => {
        writeLogHeaders();
        updateLogList();
        const refBtn = document.querySelector('#c-logs .refreshButton');
        if (refBtn) {
            refBtn.addEventListener('click', updateLogList);
        }
    };

    const writeLogHeaders = () => {
        const headElem = document.querySelector('#c-logs .thead');
        if (headElem !== null) {
            const row = createRow();
            row.appendChild(createCol('Date/Time'));
            row.appendChild(createCol('Application'));
            row.appendChild(createCol('Size'));
            headElem.appendChild(row);
        }
    };

    const updateLogList = () => {
        const logElem = document.querySelector('#c-logs .tbody');
        if (logElem !== null) {
            fin.desktop.System.getLogList((list) => {
                const newList = processLogList(list);
                for (let i = 0; i < newList.length; i++) {
                    const log = newList[i];
                    const row = createRow();
                    row.appendChild(createCol(log.formattedDate));
                    row.appendChild(createCol(log.fileName));
                    row.appendChild(createCol(log.formattedSize));
                    logElem.appendChild(row);
                }
            });
        }
    };

    const processLogList = (list: fin.LogInfo[]): LogFile[] => {
        const results = new Array<LogFile>();
        for (let i = 0; i < list.length; i++) {
            const log = list[i];
            results[results.length] = makeProcessedLogInfo(log);
        }
        results.sort((a: LogFile, b: LogFile) => {
            if (a.date === b.date) {
                return 0;
            }
            return (a.date > b.date) ? -1 : 1;
        });
        return results;
    };

    const makeProcessedLogInfo = (log: fin.LogInfo): LogFile => {
        const dateOpts = {year: 'numeric', month: '2-digit', day: '2-digit'};
        const timeOpts = {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'};
        const logDate = new Date(Date.parse(log.date || ''));
        const logSize = log.size || 0;
        const newInfo = {
            fileName: log.name || '',
            size: logSize,
            formattedSize: logSize.toLocaleString(),
            date: logDate,
            formattedDate: logDate.toLocaleDateString('en-US', dateOpts) + ' ' + logDate.toLocaleTimeString('en-US', timeOpts)
        };
        return newInfo;
    };

    // utilities

    const createRow = (): HTMLElement => {
        const e = document.createElement('div');
        e.classList.add('row');
        return e;
    };

    const createCol = (val: string, addTitle?: boolean): HTMLElement => {
        const c = document.createElement('div');
        c.classList.add('cell');
        c.innerText = val;
        if (addTitle === true) {
            c.setAttribute('title', val);
        }
        return c;
    };

    const createDebugLauncherCol = (proc: fin.ProcessInfo, ai: AppInfo): HTMLElement => {
        const launchCol = document.createElement('div');
        launchCol.classList.add('cell');
        const launcher = document.createElement('button');
        launcher.setAttribute('class', 'launchDebugger');
        launcher.innerHTML = '&#x1f41b;';
        launcher.addEventListener('click', () => {
            fin.desktop.System.showDeveloperTools(proc.uuid || '', proc.name || '', console.log, console.error);
        });
        launchCol.appendChild(launcher);
        return launchCol;
    };

    const getRuntimeVersion = (ai: AppInfo) => {
        if (ai && ai.runtime) {
            return ai.runtime.version;
        }
        return '?';
    };

    const getAppNameUUID = (proc: fin.ProcessInfo): string => {
        if (proc !== null) {
            // return proc.name + ' (' + proc.uuid + ')';
            return proc.uuid || proc.name || '';
        }
        return '--';
    };

    const getManifest = (ai: AppInfo): string => {
        if (ai) {
            return ai.manifestUrl;
        }
        return '';
    };

    const getAppURL = (ai: AppInfo): string => {
        if (ai && ai.manifest && ai.manifest.startup_app) {
            return ai.manifest.startup_app.url;
        }
        return '';
    };

    // run it all
    init();
});
