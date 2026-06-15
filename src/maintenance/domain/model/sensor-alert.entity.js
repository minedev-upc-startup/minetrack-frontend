/**
 * IoT sensor alert within the Maintenance bounded context (workshop monitoring).
 * @class SensorAlert
 */
export class SensorAlert {
    /**
     * @param {Object} params
     * @param {?number} [params.id=null]
     * @param {?number} [params.machineId=null]
     * @param {?number} [params.temperature=null]
     * @param {string} [params.status='']
     */
    constructor({ id = null, machineId = null, temperature = null, status = '' } = {}) {
        this.id = id;
        this.machineId = machineId;
        this.temperature = temperature;
        this.status = status;
    }
}
