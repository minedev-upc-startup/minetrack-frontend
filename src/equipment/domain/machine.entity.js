/**
 * Machine aggregate within the Equipment bounded context (fleet / catalog view).
 * @class Machine
 */
export class Machine {
    /**
     * @param {Object} params
     * @param {?number} [params.id=null]
     * @param {?number} [params.ownerId=null]
     * @param {string} [params.name='']
     * @param {string} [params.type='']
     * @param {string} [params.brand='']
     * @param {string} [params.model='']
     * @param {?number} [params.year=null]
     * @param {number} [params.hourlyRate=0]
     * @param {?number} [params.dailyMinimumHours=null]
     * @param {string} [params.status='']
     * @param {string[]} [params.photos=[]]
     * @param {Record<string, unknown>} [params.specs={}]
     * @param {{ lat: number, lng: number } | null} [params.currentLocation=null]
     */
    constructor({
        id = null,
        ownerId = null,
        name = '',
        type = '',
        brand = '',
        model = '',
        year = null,
        hourlyRate = 0,
        dailyMinimumHours = null,
        status = '',
        photos = [],
        specs = {},
        currentLocation = null
    } = {}) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.type = type;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.hourlyRate = hourlyRate;
        this.dailyMinimumHours = dailyMinimumHours;
        this.status = status;
        this.photos = photos;
        this.specs = specs;
        this.currentLocation = currentLocation;
    }
}
