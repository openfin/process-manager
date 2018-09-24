const KB = 1000000;
const MB = KB * 1000;
const GB = MB * 1000;

export const formatBytes = (size:number, places: number) => {
    if (size > GB) {
        return (size - GB).toFixed(places) + 'GB'
    } else if (size > MB) {
        return (size - MB).toFixed(places) + 'MB'
    } else if (size > KB) {
        return (size - KB).toFixed(places) + 'KB'
    }
    return size.toLocaleString();
}
