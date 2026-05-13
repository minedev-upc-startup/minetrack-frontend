
/**
 * Entidad Machine para el contexto de Catalog.
 * @class Machine
 */
export class Machine {
    constructor({
                    id = null,
                    ownerId = null,
                    name = '',
                    type = '',
                    brand = '',
                    model = '',
                    year = null,
                    hourlyRate = 0,
                    dailyMinimumHours = 0,
                    status = 'Available',
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