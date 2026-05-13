import { DashboardMetric } from '../domain/model/dashboard-metric.entity.js';

export class DashboardMetricAssembler {
    static toEntityFromResource(resource) {
        return new DashboardMetric({ ...resource });
    }
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(r => this.toEntityFromResource(r));
    }
}