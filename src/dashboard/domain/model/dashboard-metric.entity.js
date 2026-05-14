export class DashboardMetric {
    constructor({ id = null, title = '', value = '', icon = '', colorClass = '' } = {}) {
        this.id = id;
        this.title = title;
        this.value = value;
        this.icon = icon;
        this.colorClass = colorClass;
    }
}