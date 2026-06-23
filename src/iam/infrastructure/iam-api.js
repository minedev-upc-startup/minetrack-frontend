const BASE_URL = import.meta.env.VITE_MINETRACK_API_URL ;

export class IamApi {
    async signIn(command) {
        const response = await fetch(`${BASE_URL}/authentication/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Sign-in failed');
        }

        return await response.json();
    }

    async signUp(command) {
        const response = await fetch(`${BASE_URL}/authentication/sign-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Sign-up failed');
        }

        return await response.json();
    }
}