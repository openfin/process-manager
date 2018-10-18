const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export const formatBytes = (size:number, places: number) => {
    if (size > GB) {
        return (size / GB).toFixed(places) + 'GB'
    } else if (size > MB) {
        return (size / MB).toFixed(places) + 'MB'
    } else if (size > KB) {
        return (size / KB).toFixed(places) + 'KB'
    } else if (size === 0) {
        return '0';
    } else {
        return size.toFixed(1) + 'B'
    }
}
