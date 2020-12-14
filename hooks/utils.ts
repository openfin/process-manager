const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

// format a number as bytes (example: 1024 => 1KB)
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

export const defaultAppOptions = {
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

export const url2AppName = (name: string) => {
    return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
}

export const url2AppUUID = (name: string) => {
    return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
}

const colorCache:{[key:string]:string} = {};
export const getRandomFillColor = (uuid: string, name: string, brightness: number) => {
    const key = uuid + '__' + name;
    const color = colorCache[key];
    if (color) {
        return color;
    } else {
        const color = '#' + randomColorChannel(brightness) + randomColorChannel(brightness) + randomColorChannel(brightness);
        colorCache[key] = color;
        return color;
    }
}

export const randomColorChannel = (brightness:number) => {
    const r = 255-brightness;
    const n = 0|((Math.random() * r) + brightness);
    const s = n.toString(16);
    return (s.length === 1) ? '0'+s : s;
}