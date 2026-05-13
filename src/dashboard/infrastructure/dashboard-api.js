import { BaseApi } from '../../shared/infrastructure/base-api.js';

export class DashboardApi extends BaseApi {
    async getMetrics() {
        try {
            const [machinesRes, rentalsRes, alertsRes, reviewsRes] = await Promise.all([
                this.http.get('/machines'),
                this.http.get('/rentals?status=Active'),
                this.http.get('/iotAlerts'),
                this.http.get('/reviews')
            ]);

            return {
                status: 200,
                data: [
                    { id: 1, title: 'Maquinaria Total', value: machinesRes.data.length.toString(), icon: 'pi pi-truck', colorClass: 'text-orange-500' },
                    { id: 2, title: 'Alquileres Activos', value: rentalsRes.data.length.toString(), icon: 'pi pi-calendar-check', colorClass: 'text-green-500' },
                    { id: 3, title: 'Alertas IoT', value: alertsRes.data.length.toString(), icon: 'pi pi-exclamation-triangle', colorClass: 'text-red-500' },
                    { id: 4, title: 'Reseñas Totales', value: reviewsRes.data.length.toString(), icon: 'pi pi-star', colorClass: 'text-blue-500' }
                ]
            };
        } catch (error) {
            console.error("Error al obtener las métricas del dashboard:", error);
            return { status: 500, data: [] };
        }
    }
}