export class EarningsPoint {
    constructor({ label = '', value = 0, filterKey = '' } = {}) {
        this.label = label;
        this.value = value;
        this.filterKey = filterKey;
    }
}
