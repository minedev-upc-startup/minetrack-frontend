export class DashboardMetric {
    constructor({ id = null, title = '', value = '', subtitle = '', subtitleParams = null, routeName = null, icon = '', colorClass = '' } = {}) {
        this.id = id;
        this.title = title;
        this.value = value;
        this.subtitle = subtitle;
        this.subtitleParams = subtitleParams;
        this.routeName = routeName;
        this.icon = icon;
        this.colorClass = colorClass;
    }
}
