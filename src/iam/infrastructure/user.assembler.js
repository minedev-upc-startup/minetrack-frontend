import { User } from '../domain/user.entity.js';

/**
 * Maps user resources from the API into User domain entities.
 * @class UserAssembler
 */
export class UserAssembler {
    /**
     * Convert a single user resource to an entity (omits password).
     * @param {Object} resource
     * @returns {User}
     */
    static toEntityFromResource(resource) {
        return new User({
            id: resource.id,
            email: resource.email,
            fullName: resource.fullName,
            role: resource.role,
            phone: resource.phone,
            company: resource.company
        });
    }
}
