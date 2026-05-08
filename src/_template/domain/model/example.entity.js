/**
 * Example entity. Replace this whole file with your real entity.
 *
 * @class Example
 */
export class Example {
    /**
     * @param {Object} params
     * @param {?number} [params.id=null]
     * @param {string} [params.name='']
     */
    constructor({ id = null, name = '' } = {}) {
        this.id = id;
        this.name = name;
    }
}
