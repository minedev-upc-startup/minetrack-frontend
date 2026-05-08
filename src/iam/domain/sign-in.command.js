/**
 * Command for the sign-in use case.
 * @class SignInCommand
 */
export class SignInCommand {
    /**
     * @param {string} email
     * @param {string} password
     */
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
}
