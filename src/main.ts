document.addEventListener('DOMContentLoaded', () => {
    const SELECTED:string = 'selected';
    // wire up top tabs
    const tabs = document.querySelectorAll('#tab-bar li');
    const contents = document.querySelectorAll('#tab-contents .tab-content');

    tabs[0].classList.add(SELECTED);
    contents[0].classList.add(SELECTED);

    // tab bar logic
    for (let i=0; i<tabs.length; i++) {
        tabs[i].addEventListener('click', (e:Event) => {
            if (e.srcElement !== null) {
                handleTabClick(<HTMLElement>e.srcElement);
            }
        });
    }

    // processes (apps/services) tab
    const procElem = document.querySelector('#c-processes .tbody');
    if (procElem !== null) {
        fin.desktop.System.getProcessList(async function (list) {
            for (let i=0; i<list.length; i++) {
                const proc = list[i];
                const appInfo = await new Promise( (res, rej) => {
                    fin.desktop.Application.wrap(proc.uuid|| "").getInfo(res, rej);
                });
                const row = createProcRow();
                row.appendChild(createProcCol(proc.name || ""));
                row.appendChild(createProcCol(proc.uuid || ""));
                row.appendChild(createProcCol((proc.processId || -1).toString()));

                
                // TODO get mem/cpu, etc?

                procElem.appendChild(row);
            }
        });
    }

    // processes (apps/services) tab
    const logElem = document.querySelector('#c-logs .tbody');
    if (logElem !== null) {
        fin.desktop.System.getLogList(function (list) {
            for (let i=0; i<list.length; i++) {
                const proc = list[i];
                const row = createProcRow();
                row.appendChild(createProcCol(proc.name || ""));
                row.appendChild(createProcCol(proc.date || ""));
                row.appendChild(createProcCol((proc.size || -1).toString()));
                logElem.appendChild(row);
            }
        });
    }
    
    const createProcRow = (): HTMLElement => {
        const e = document.createElement('div');
        e.classList.add('row');
        return e;
    }

    const createProcCol = (val:string): HTMLElement => {
        const c = document.createElement('div');
        c.classList.add('cell');
        c.innerText = val;
        return c;
    }

    const handleTabClick = (elem:HTMLElement) => {
        // deslect everything
        for (let i=0; i<tabs.length; i++) {
            tabs[i].classList.remove(SELECTED);
            contents[i].classList.remove(SELECTED);
        }
        // select the tab/content that was clicked
        elem.classList.add(SELECTED);
        let id = elem.getAttribute('id');
        if (id != null) {
            id = id.replace('tab-', 'c-');
            const content = document.getElementById(id);
            if (content!==null) { 
                content.classList.add(SELECTED);
            }
        }
    }
});
