export class DashboardTableRow {
    constructor({
        id = null,
        machineCode = '',
        machineName = '',
        clientName = '',
        startDate = '',
        endDate = '',
        status = '',
        statusKey = '',
        cost = '',
        sortStart = '',
        sortEnd = '',
        sortCost = 0,
        linkRoute = null,
        linkParams = null,
        rowType = 'rental'
    } = {}) {
        this.id = id;
        this.machineCode = machineCode;
        this.machineName = machineName;
        this.clientName = clientName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.statusKey = statusKey;
        this.cost = cost;
        this.sortStart = sortStart;
        this.sortEnd = sortEnd;
        this.sortCost = sortCost;
        this.linkRoute = linkRoute;
        this.linkParams = linkParams;
        this.rowType = rowType;
    }
}
