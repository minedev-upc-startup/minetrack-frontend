import { BaseApi } from '../../shared/infrastructure/base-api.js';

export class DashboardApi extends BaseApi {
    async getOwnerOverview(ownerId) {
        try {
            const [
                machinesRes,
                activeRentalsRes,
                allRentalsRes,
                alertsRes,
                usersRes
            ] = await Promise.all([
                this.http.get('/machines', { params: { ownerId } }),
                this.http.get('/rentals', { params: { ownerId, status: 'Active' } }),
                this.http.get('/rentals', { params: { ownerId } }),
                this.http.get('/iotAlerts'),
                this.http.get('/users')
            ]);

            const machines = machinesRes.data ?? [];
            const machineIds = new Set(machines.map(machine => machine.id));
            const machinesById = Object.fromEntries(machines.map(machine => [machine.id, machine]));
            const usersById = Object.fromEntries((usersRes.data ?? []).map(user => [user.id, user]));

            return {
                status: 200,
                data: {
                    machines,
                    activeRentals: activeRentalsRes.data ?? [],
                    closedRentals: (allRentalsRes.data ?? []).filter(rental => rental.status === 'Closed'),
                    alerts: (alertsRes.data ?? []).filter(alert => machineIds.has(alert.machineId) && !alert.resolvedAt),
                    machinesById,
                    usersById
                }
            };
        } catch (error) {
            console.error('Error al obtener el resumen del dashboard:', error);
            return { status: 500, data: null };
        }
    }

    async getClientOverview(clientId) {
        try {
            const [requestsRes, rentalsRes, machinesRes] = await Promise.all([
                this.http.get(`/clients/${clientId}/rentals`),
                this.http.get(`/clients/${clientId}/rentals`),
                this.http.get('/machines')
            ]);
            return {
                status: 200,
                data: {
                    requests: requestsRes.data ?? [],
                    rentals: rentalsRes.data ?? [],
                    machinesById: Object.fromEntries((machinesRes.data ?? []).map(machine => [machine.id, machine]))
                }
            };
        } catch (error) {
            console.error('Error al obtener el resumen del cliente:', error);
            return { status: 500, data: null };
        }
    }

    async getIntermediaryOverview() {
        try {
            const [machinesRes, rentalsRes, alertsRes, requestsRes, usersRes] = await Promise.all([
                this.http.get('/machines'),
                this.http.get('/rentals'),
                this.http.get('/iotAlerts'),
                this.http.get('/rentalRequests'),
                this.http.get('/users')
            ]);

            const machines = machinesRes.data ?? [];
            const rentals = rentalsRes.data ?? [];
            const usersById = Object.fromEntries((usersRes.data ?? []).map(user => [user.id, user]));

            return {
                status: 200,
                data: {
                    machines,
                    activeRentals: rentals.filter(rental => rental.status === 'Active'),
                    closedRentals: rentals.filter(rental => rental.status === 'Closed'),
                    alerts: (alertsRes.data ?? []).filter(alert => !alert.resolvedAt),
                    pendingRequests: (requestsRes.data ?? []).filter(request => request.status === 'Pending'),
                    machinesById: Object.fromEntries(machines.map(machine => [machine.id, machine])),
                    usersById
                }
            };
        } catch (error) {
            console.error('Error al obtener el resumen operativo:', error);
            return { status: 500, data: null };
        }
    }
}
