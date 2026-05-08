/**
 * User entity within the IAM bounded context.
 * @class User
 */
export class User {
    /**
     * @param {Object} params
     * @param {?number} [params.id=null]
     * @param {string} [params.email='']
     * @param {string} [params.fullName='']
     * @param {string} [params.role='Client']  - "Owner" | "Client"
     * @param {string} [params.phone='']
     * @param {string} [params.company='']
     */
    constructor({ id = null, email = '', fullName = '', role = 'Client', phone = '', company = '' } = {}) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.phone = phone;
        this.company = company;
    }
}
