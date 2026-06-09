export class StatusChartPoint {
    constructor({ label = '', value = 0, color = '#f59e0b', filterKey = 'all' } = {}) {
        this.label = label;
        this.value = value;
        this.color = color;
        this.filterKey = filterKey;
    }
}
