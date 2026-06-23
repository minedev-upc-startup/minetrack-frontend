const SEED_USERS = [
    { id: 1,  email: 'carlos@minetrack.app',           password: 'password123', role: 'Owner',  fullName: 'Carlos Mendoza Vargas', phone: '+51 999 111 111', company: 'Mendoza Maquinaria SAC' },
    { id: 2,  email: 'sandra@minetrack.app',           password: 'password123', role: 'Owner',  fullName: 'Sandra Quispe Ramos',   phone: '+51 999 222 222', company: 'Quispe Equipos Pesados EIRL' },
    { id: 3,  email: 'rodrigo@minetrack.app',          password: 'password123', role: 'Owner',  fullName: 'Rodrigo Salinas Tello', phone: '+51 999 333 333', company: 'Salinas Heavy Rentals SAC' },
    { id: 4,  email: 'elena@minetrack.app',            password: 'password123', role: 'Owner',  fullName: 'Elena Pacheco Núñez',   phone: '+51 999 444 444', company: 'Pacheco Mining Fleet SAC' },
    { id: 5,  email: 'operations@minasdelsur.pe',      password: 'password123', role: 'Client', fullName: 'Javier Ortega',         phone: '+51 988 100 100', company: 'Minas del Sur SAC' },
    { id: 6,  email: 'logistics@andesmining.pe',       password: 'password123', role: 'Client', fullName: 'Patricia Roldán',       phone: '+51 988 200 200', company: 'Andes Mining Operations SAC' },
    { id: 7,  email: 'compras@cantarana.pe',           password: 'password123', role: 'Client', fullName: 'Miguel Flores',         phone: '+51 988 300 300', company: 'Cantarana Construcciones SAC' },
    { id: 8,  email: 'field@altipeak.pe',              password: 'password123', role: 'Client', fullName: 'Lucía Bermúdez',        phone: '+51 988 400 400', company: 'Altipeak Extracción SAC' },
    { id: 9,  email: 'site@reciomining.pe',            password: 'password123', role: 'Client', fullName: 'Daniel Cárdenas',       phone: '+51 988 500 500', company: 'Recio Mining SAC' },
    { id: 16, email: 'cliente.demo@minetrack.app',     password: 'password123', role: 'Client', fullName: 'Demo Cliente',          phone: '+51 988 600 600', company: 'Cliente Demo SAC' },
    { id: 17, email: 'propietario.demo@minetrack.app', password: 'password123', role: 'Owner',  fullName: 'Demo Propietario',      phone: '+51 999 666 666', company: 'Flota Demo SAC' },
];

// In-memory registry for users created during the session via sign-up.
// NOTE: Temporary until Zahir's IAM bounded context is integrated.
//       When the C# backend ships, only this class needs to change.
const _runtimeUsers = [];
let _nextId = 100;

export class IamApi {
    findByEmail(email) {
        const all = [...SEED_USERS, ..._runtimeUsers];
        const data = all.filter(u => u.email === email);
        return Promise.resolve({ data });
    }

    createUser(resource) {
        const all = [...SEED_USERS, ..._runtimeUsers];
        const existing = all.find(u => u.email === resource.email);
        if (existing) return Promise.reject(new Error('Email already in use'));
        const newUser = { ...resource, id: _nextId++ };
        _runtimeUsers.push(newUser);
        return Promise.resolve({ data: newUser });
    }
}