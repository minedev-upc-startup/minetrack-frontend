import { BaseApi } from '../../shared/infrastructure/base-api.js';

export class DashboardApi extends BaseApi {
    getMetrics() {
        return Promise.resolve({
            status: 200,
            data: [
                { id: 1, title: 'Maquinaria Total', value: '12', icon: 'pi pi-truck', colorClass: 'text-orange-500' },
                { id: 2, title: 'Alquileres Activos', value: '3', icon: 'pi pi-calendar-check', colorClass: 'text-green-500' },
                { id: 3, title: 'Alertas IoT', value: '1', icon: 'pi pi-exclamation-triangle', colorClass: 'text-red-500' },
                { id: 4, title: 'Reseñas Pendientes', value: '4', icon: 'pi pi-star', colorClass: 'text-blue-500' }
            ]
        });
    }
}