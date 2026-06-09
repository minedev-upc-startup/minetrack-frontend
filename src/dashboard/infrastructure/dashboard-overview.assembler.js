import { DashboardMetric } from '../domain/model/dashboard-metric.entity.js';
import { DashboardTableRow } from '../domain/model/dashboard-table-row.entity.js';
import { EarningsPoint } from '../domain/model/earnings-point.entity.js';
import { StatusChartPoint } from '../domain/model/status-chart-point.entity.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function machineCode(machine) {
    const prefix = (machine.brand ?? 'MAC').replace(/\s+/g, '').slice(0, 3).toUpperCase();
    return `${prefix}${String(machine.id).padStart(3, '0')}`;
}

function formatDate(isoDate) {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}

function formatMoney(amount) {
    if (!amount && amount !== 0) return '—';
    if (amount >= 1000) return `S/ ${(amount / 1000).toFixed(1)}k`;
    return `S/ ${amount.toLocaleString('es-PE')}`;
}

function isClosingSoon(endDate) {
    if (!endDate) return false;
    const end = new Date(`${endDate}T00:00:00`);
    const now = new Date();
    const diffDays = (end - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
}

function buildMonthlySeries(records, months = 6, valueSelector) {
    const now = new Date();
    const points = [];

    for (let i = months - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        const total = records
            .filter(record => {
                const rawDate = valueSelector.dateOf(record);
                if (!rawDate) return false;
                const parsed = new Date(rawDate);
                return parsed.getMonth() === month && parsed.getFullYear() === year;
            })
            .reduce((sum, record) => sum + valueSelector.amount(record), 0);

        points.push(new EarningsPoint({
            label: MONTH_LABELS[month],
            value: Math.round(total / 100) / 10,
            filterKey: `${year}-${String(month + 1).padStart(2, '0')}`
        }));
    }

    return points;
}

function earningsGrowth(points) {
    if (points.length < 2) return null;
    const current = points[points.length - 1].value;
    const previous = points[points.length - 2].value;
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

function chartTotalLabel(points) {
    return `${points.reduce((sum, point) => sum + point.value, 0).toFixed(1)}k`;
}

function monthEarnings(closedRentals) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return closedRentals
        .filter(rental => {
            const closedAt = rental.closedAt ?? rental.endDate;
            if (!closedAt) return false;
            const closed = new Date(closedAt);
            return closed.getMonth() === currentMonth && closed.getFullYear() === currentYear;
        })
        .reduce((sum, rental) => sum + (rental.totalCost ?? 0), 0);
}

function monthGrowth(closedRentals) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthTotal = monthEarnings(closedRentals);
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousTotal = closedRentals
        .filter(rental => {
            const closedAt = rental.closedAt ?? rental.endDate;
            if (!closedAt) return false;
            const closed = new Date(closedAt);
            return closed.getMonth() === previousMonthDate.getMonth()
                && closed.getFullYear() === previousMonthDate.getFullYear();
        })
        .reduce((sum, rental) => sum + (rental.totalCost ?? 0), 0);

    if (!previousTotal) return monthTotal > 0 ? 100 : 0;
    return Math.round(((monthTotal - previousTotal) / previousTotal) * 100);
}

function buildOwnerRentalRows(activeRentals, machinesById, usersById) {
    return activeRentals.map(rental => {
        const machine = machinesById[rental.machineId] ?? {};
        const client = usersById[rental.clientId] ?? {};
        return new DashboardTableRow({
            id: rental.id,
            machineCode: machine.id ? machineCode(machine) : `RNT${String(rental.id).padStart(3, '0')}`,
            machineName: machine.brand && machine.model ? `${machine.brand} ${machine.model}` : machine.name ?? '—',
            clientName: client.company ?? client.fullName ?? '—',
            startDate: formatDate(rental.startDate),
            endDate: formatDate(rental.endDate),
            status: rental.status,
            statusKey: `dashboard.status.${rental.status}`,
            rowType: 'rental',
            sortStart: rental.startDate,
            sortEnd: rental.endDate,
            linkRoute: 'owner-active-rentals',
            linkParams: {}
        });
    });
}

function buildClientRows(requests, machinesById) {
    return requests.map(request => {
        const machine = machinesById[request.machineId] ?? {};
        return new DashboardTableRow({
            id: request.id,
            machineCode: `REQ${String(request.id).padStart(3, '0')}`,
            machineName: machine.brand && machine.model ? `${machine.brand} ${machine.model}` : machine.name ?? `Máquina #${request.machineId}`,
            clientName: '—',
            startDate: formatDate(request.startDate),
            endDate: formatDate(request.endDate),
            status: request.status,
            statusKey: `dashboard.requestStatus.${request.status}`,
            cost: formatMoney(request.estimatedTotalCost),
            rowType: 'request',
            sortStart: request.startDate,
            sortEnd: request.endDate,
            sortCost: request.estimatedTotalCost ?? 0,
            linkRoute: 'client-my-requests',
            linkParams: {}
        });
    });
}

function buildIntermediaryPendingRows(pendingRequests, machinesById, usersById) {
    return pendingRequests.map(request => {
        const machine = machinesById[request.machineId] ?? {};
        const client = usersById[request.clientId] ?? {};
        return new DashboardTableRow({
            id: `request-${request.id}`,
            machineCode: `REQ${String(request.id).padStart(3, '0')}`,
            machineName: machine.brand && machine.model ? `${machine.brand} ${machine.model}` : machine.name ?? `Máquina #${request.machineId}`,
            clientName: client.company ?? client.fullName ?? '—',
            startDate: formatDate(request.startDate),
            endDate: formatDate(request.endDate),
            status: 'Pending',
            statusKey: 'dashboard.requestStatus.Pending',
            rowType: 'request',
            sortStart: request.startDate,
            sortEnd: request.endDate,
            linkRoute: 'intermediary-requests',
            linkParams: {}
        });
    });
}

function buildIntermediaryRows(activeRentals, machinesById, usersById) {
    return activeRentals.map(rental => {
        const machine = machinesById[rental.machineId] ?? {};
        const client = usersById[rental.clientId] ?? {};
        const owner = usersById[rental.ownerId] ?? {};
        return new DashboardTableRow({
            id: rental.id,
            machineCode: machine.id ? machineCode(machine) : `RNT${String(rental.id).padStart(3, '0')}`,
            machineName: machine.brand && machine.model ? `${machine.brand} ${machine.model}` : machine.name ?? '—',
            clientName: client.company ?? client.fullName ?? '—',
            startDate: formatDate(rental.startDate),
            endDate: formatDate(rental.endDate),
            status: owner.company ?? owner.fullName ?? '—',
            statusKey: '',
            rowType: 'rental',
            sortStart: rental.startDate,
            sortEnd: rental.endDate,
            linkRoute: 'intermediary-rentals',
            linkParams: {}
        });
    });
}

export class DashboardOverviewAssembler {
    static toOwnerOverview(raw) {
        const { machines, activeRentals, closedRentals, alerts, machinesById, usersById } = raw;
        const availableCount = machines.filter(machine => machine.status === 'Available').length;
        const closingSoonCount = activeRentals.filter(rental => isClosingSoon(rental.endDate)).length;
        const earningsSeries = buildMonthlySeries(closedRentals, 12, {
            dateOf: rental => rental.closedAt ?? rental.endDate,
            amount: rental => rental.totalCost ?? 0
        });
        const monthTotal = monthEarnings(closedRentals);

        return {
            metrics: [
                new DashboardMetric({ id: 1, title: 'dashboard.kpi.machines', value: String(machines.length), subtitle: 'dashboard.kpi.availableCount', subtitleParams: { count: availableCount }, routeName: 'owner-machines' }),
                new DashboardMetric({ id: 2, title: 'dashboard.kpi.activeRentals', value: String(activeRentals.length), subtitle: 'dashboard.kpi.closingSoonCount', subtitleParams: { count: closingSoonCount }, routeName: 'owner-active-rentals' }),
                new DashboardMetric({ id: 3, title: 'dashboard.kpi.monthEarnings', value: formatMoney(monthTotal), subtitle: 'dashboard.kpi.monthGrowth', subtitleParams: { percent: monthGrowth(closedRentals) }, routeName: 'owner-earnings' }),
                new DashboardMetric({ id: 4, title: 'dashboard.kpi.pendingAlerts', value: String(alerts.length), subtitle: alerts.length ? 'dashboard.kpi.alertsOpen' : 'dashboard.kpi.notAvailable', routeName: 'owner-iot-history' })
            ],
            tableRows: buildOwnerRentalRows(activeRentals, machinesById, usersById),
            earningsSeries,
            chartTotal: chartTotalLabel(earningsSeries.slice(-6)),
            chartGrowth: earningsGrowth(earningsSeries.slice(-6)),
            statusSeries: [
                new StatusChartPoint({ label: 'dashboard.status.Active', value: activeRentals.length, color: '#22c55e', filterKey: 'Active' }),
                new StatusChartPoint({ label: 'dashboard.status.Available', value: availableCount, color: '#38bdf8', filterKey: 'Available' }),
                new StatusChartPoint({ label: 'dashboard.kpi.pendingAlerts', value: alerts.length, color: '#fb7185', filterKey: 'Alerts' })
            ],
            fleetOperational: machines.length > 0 && alerts.length === 0,
            tableMode: 'owner'
        };
    }

    static toClientOverview(raw) {
        const { requests, rentals, machinesById } = raw;
        const activeRentals = rentals.filter(rental => rental.status === 'Active');
        const closedRentals = rentals.filter(rental => rental.status === 'Closed');
        const pendingCount = requests.filter(request => request.status === 'Pending').length;
        const monthSpend = monthEarnings(closedRentals);
        const earningsSeries = buildMonthlySeries(
            [...closedRentals, ...requests.filter(request => request.status === 'Approved')],
            12,
            {
                dateOf: record => record.closedAt ?? record.resolvedAt ?? record.submittedAt ?? record.startDate,
                amount: record => record.totalCost ?? record.estimatedTotalCost ?? 0
            }
        );

        return {
            metrics: [
                new DashboardMetric({ id: 1, title: 'dashboard.kpi.clientRequests', value: String(requests.length), subtitle: 'dashboard.kpi.clientPending', subtitleParams: { count: pendingCount }, routeName: 'client-my-requests' }),
                new DashboardMetric({ id: 2, title: 'dashboard.kpi.activeRentals', value: String(activeRentals.length), subtitle: 'dashboard.kpi.clientActiveHint', routeName: 'client-catalog' }),
                new DashboardMetric({ id: 3, title: 'dashboard.kpi.monthSpend', value: formatMoney(monthSpend), subtitle: 'dashboard.kpi.monthGrowth', subtitleParams: { percent: monthGrowth(closedRentals) }, routeName: 'client-my-requests' }),
                new DashboardMetric({ id: 4, title: 'dashboard.kpi.approvedRequests', value: String(requests.filter(request => request.status === 'Approved').length), subtitle: 'dashboard.kpi.approvedHint', routeName: 'client-my-requests' })
            ],
            tableRows: buildClientRows(requests, machinesById),
            earningsSeries,
            chartTotal: chartTotalLabel(earningsSeries.slice(-6)),
            chartGrowth: earningsGrowth(earningsSeries.slice(-6)),
            statusSeries: [
                new StatusChartPoint({ label: 'dashboard.requestStatus.Pending', value: requests.filter(request => request.status === 'Pending').length, color: '#f59e0b', filterKey: 'Pending' }),
                new StatusChartPoint({ label: 'dashboard.requestStatus.Approved', value: requests.filter(request => request.status === 'Approved').length, color: '#22c55e', filterKey: 'Approved' }),
                new StatusChartPoint({ label: 'dashboard.requestStatus.Rejected', value: requests.filter(request => request.status === 'Rejected').length, color: '#fb7185', filterKey: 'Rejected' })
            ],
            fleetOperational: pendingCount === 0,
            tableMode: 'client'
        };
    }

    static toIntermediaryOverview(raw) {
        const {
            machines,
            activeRentals,
            closedRentals,
            alerts,
            pendingRequests,
            machinesById,
            usersById
        } = raw;

        const earningsSeries = buildMonthlySeries(closedRentals, 12, {
            dateOf: rental => rental.closedAt ?? rental.endDate,
            amount: rental => rental.totalCost ?? 0
        });

        return {
            metrics: [
                new DashboardMetric({ id: 1, title: 'dashboard.kpi.machines', value: String(machines.length), subtitle: 'dashboard.kpi.platformFleet', routeName: 'intermediary-catalog' }),
                new DashboardMetric({ id: 2, title: 'dashboard.kpi.activeRentals', value: String(activeRentals.length), subtitle: 'dashboard.kpi.platformActive', routeName: 'intermediary-rentals' }),
                new DashboardMetric({ id: 3, title: 'dashboard.kpi.pendingRequests', value: String(pendingRequests.length), subtitle: 'dashboard.kpi.awaitingReview', routeName: 'intermediary-requests' }),
                new DashboardMetric({ id: 4, title: 'dashboard.kpi.pendingAlerts', value: String(alerts.length), subtitle: 'dashboard.kpi.alertsOpen', routeName: 'intermediary-alerts' })
            ],
            tableRows: [
                ...buildIntermediaryRows(activeRentals, machinesById, usersById),
                ...buildIntermediaryPendingRows(pendingRequests, machinesById, usersById)
            ],
            earningsSeries,
            chartTotal: chartTotalLabel(earningsSeries.slice(-6)),
            chartGrowth: earningsGrowth(earningsSeries.slice(-6)),
            statusSeries: [
                new StatusChartPoint({ label: 'dashboard.kpi.activeRentals', value: activeRentals.length, color: '#22c55e', filterKey: 'Active' }),
                new StatusChartPoint({ label: 'dashboard.kpi.pendingRequests', value: pendingRequests.length, color: '#f59e0b', filterKey: 'Pending' }),
                new StatusChartPoint({ label: 'dashboard.kpi.pendingAlerts', value: alerts.length, color: '#fb7185', filterKey: 'Alerts' })
            ],
            fleetOperational: alerts.length === 0,
            tableMode: 'intermediary'
        };
    }
}
