interface AppInfo {
    runtime: AppVersion;
    manifestUrl: string;
    startup_app: StartUpApp;
}
interface AppVersion {
    version: string;
}
interface StartUpApp {
    url: string;
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
            tabs[i].addEventListener('click', (e: Event) => {
                if (e.srcElement !== null) {
                    handleTabClick(e.srcElement as HTMLElement);
                }
            });
        }
    };

    const handleTabClick = (elem: HTMLElement) => {
        // deslect everything
        for (let i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove(SELECTED);
            contents[i].classList.remove(SELECTED);
        }
        // select the tab/content that was clicked
        elem.classList.add(SELECTED);
        let id = elem.getAttribute('id');
        if (id != null) {
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
    };

    const writeProcessHeaders = () => {
        const headElem = document.querySelector('#c-processes .thead');
        if (headElem !== null) {
            const row = createRow();
            row.appendChild(createCol('Application'));
            row.appendChild(createCol('Manifest'));
            row.appendChild(createCol('URL'));
            row.appendChild(createCol('Process ID'));
            row.appendChild(createCol('Runtime'));
            headElem.appendChild(row);
        }
    };

    const updateProcessList = () => {
        const procElem = document.querySelector('#c-processes .tbody');
        if (procElem !== null) {
            fin.desktop.System.getProcessList(async (list) => {
                for (let i = 0; i < list.length; i++) {
                    const proc = list[i];
                    const appInf = await new Promise((res, rej) => {
                        fin.desktop.Application.wrap(proc.uuid || '').getInfo(res, rej);
                    });
                    const row = createRow();
                    row.appendChild(createCol(getAppNameUUID(proc)));
                    row.appendChild(createCol(getManifest(appInf as AppInfo)));
                    row.appendChild(createCol(getAppURL(appInf as AppInfo)));
                    row.appendChild(createCol((proc.processId || -1).toString()));
                    row.appendChild(createCol(getRuntimeVersion(appInf as AppInfo)));

                    // TODO get mem/cpu, etc?

                    procElem.appendChild(row);
                }
            });
        }
    };

    const initLogList = () => {
        writeLogHeaders();
        updateLogList();
    };

    const writeLogHeaders = () => {
        const headElem = document.querySelector('#c-logs .thead');
        if (headElem !== null) {
            const row = createRow();
            row.appendChild(createCol('Application'));
            row.appendChild(createCol('Date'));
            row.appendChild(createCol('Size'));
            headElem.appendChild(row);
        }
    };

    const updateLogList = () => {
        const logElem = document.querySelector('#c-logs .tbody');
        if (logElem !== null) {
            fin.desktop.System.getLogList((list) => {
                for (let i = 0; i < list.length; i++) {
                    const log = list[i];
                    const row = createRow();
                    row.appendChild(createCol(log.name || ''));
                    row.appendChild(createCol(log.date || ''));
                    row.appendChild(createCol((log.size || -1).toString()));
                    logElem.appendChild(row);
                }
            });
        }
    };

    // utilities

    const createRow = (): HTMLElement => {
        const e = document.createElement('div');
        e.classList.add('row');
        return e;
    };

    const createCol = (val: string): HTMLElement => {
        const c = document.createElement('div');
        c.classList.add('cell');
        c.innerText = val;
        return c;
    };

    const getRuntimeVersion = (ai: AppInfo) => {
        if (ai && ai.runtime) {
            return ai.runtime.version;
        }
        return '?';
    };

    const getAppNameUUID = (proc: fin.ProcessInfo): string => {
        if (proc !== null) {
            return proc.name + ' (' + proc.uuid + ')';
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
        if (ai && ai.startup_app) {
            return ai.startup_app.url;
        }
        return '';
    };

    // run it all
    init();
});
