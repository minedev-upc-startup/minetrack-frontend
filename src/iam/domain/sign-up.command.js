/**
 * Command for the sign-up use case.
 * @class SignUpCommand
 */
export class SignUpCommand {
    /**
     * @param {Object} params
     * @param {string} params.email
     * @param {string} params.password
     * @param {string} params.fullName
     * @param {string} params.role - "Owner" | "Client" | "Intermediary"
     * @param {string} [params.phone='']
     * @param {string} [params.company='']
     */
    constructor({ email, password, fullName, role, phone = '', company = '' }) {
        this.username = email;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.phone = phone;
        this.company = company;
    }
}
