import { normalizeAppRole } from './user-role.js';

/**
 * Sidebar navigation items per authenticated role.
 * Each item: { labelKey: i18n key, routeName: vue-router name, icon: PrimeIcons class }
 *
 * @param {unknown} role - "Client" | "Owner" | "Intermediary" | "Maintenance" (any casing)
 * @returns {Array<{ labelKey: string, routeName: string, icon: string }>}
 */
export function getSidebarItemsForRole(role) {
    switch (normalizeAppRole(role)) {
        case 'Client':
            return [
                { labelKey: 'nav.clientDashboard', routeName: 'client-dashboard', icon: 'pi pi-home' },
                { labelKey: 'nav.clientMyRequests', routeName: 'client-my-requests', icon: 'pi pi-inbox' },
                { labelKey: 'nav.clientMyRentals', routeName: 'client-my-rentals', icon: 'pi pi-truck' },
                { labelKey: 'nav.catalog', routeName: 'client-catalog', icon: 'pi pi-th-large' }
            ];
        case 'Owner':
            return [
                { labelKey: 'nav.ownerDashboard', routeName: 'owner-dashboard', icon: 'pi pi-circle' },
                { labelKey: 'nav.myMachines', routeName: 'owner-machines', icon: 'pi pi-wrench' },
                { labelKey: 'nav.ownerActiveRentals', routeName: 'owner-active-rentals', icon: 'pi pi-play' },
                { labelKey: 'nav.ownerEarnings', routeName: 'owner-earnings', icon: 'pi pi-chart-line' },
                { labelKey: 'nav.ownerIotHistory', routeName: 'owner-iot-history', icon: 'pi pi-bolt' },
                { labelKey: 'nav.ownerProfile', routeName: 'owner-profile', icon: 'pi pi-cog' }
            ];
        case 'Intermediary':
            return [
                { labelKey: 'nav.intermediaryOperationalPanel', routeName: 'intermediary-dashboard', icon: 'pi pi-desktop' },
                { labelKey: 'nav.catalog', routeName: 'intermediary-catalog', icon: 'pi pi-book' },
                { labelKey: 'nav.intermediaryRequests', routeName: 'intermediary-requests', icon: 'pi pi-envelope' },
                { labelKey: 'nav.intermediaryRentals', routeName: 'intermediary-rentals', icon: 'pi pi-file' },
                { labelKey: 'nav.intermediaryIotMonitors', routeName: 'intermediary-iot', icon: 'pi pi-wifi' },
                { labelKey: 'nav.intermediaryAlerts', routeName: 'intermediary-alerts', icon: 'pi pi-bell' },
                { labelKey: 'nav.intermediaryBilling', routeName: 'intermediary-billing', icon: 'pi pi-credit-card' },
                { labelKey: 'nav.intermediaryUsers', routeName: 'intermediary-users', icon: 'pi pi-users' }
            ];
        case 'Maintenance':
            return [
                { labelKey: 'nav.iotMonitor', routeName: 'iot-panel', icon: 'pi pi-wifi' }
            ];
        default:
            return [];
    }
}

/**
 * Top navigation items shown in the dashboard shell header.
 *
 * @param {unknown} role
 * @returns {Array<{ labelKey: string, routeName: string }>}
 */
export function getTopNavItemsForRole(role) {
    switch (normalizeAppRole(role)) {
        case 'Owner':
            return [
                { labelKey: 'nav.ownerDashboard', routeName: 'owner-dashboard' },
                { labelKey: 'nav.myMachines', routeName: 'owner-machines' },
                { labelKey: 'nav.ownerActiveRentals', routeName: 'owner-active-rentals' },
                { labelKey: 'nav.ownerEarnings', routeName: 'owner-earnings' }
            ];
        case 'Client':
            return [
                { labelKey: 'nav.clientDashboard', routeName: 'client-dashboard' },
                { labelKey: 'nav.catalog', routeName: 'client-catalog' },
                { labelKey: 'nav.clientMyRequests', routeName: 'client-my-requests' },
                { labelKey: 'nav.clientMyRentals', routeName: 'client-my-rentals' }
            ];
        case 'Intermediary':
            return [
                { labelKey: 'nav.intermediaryOperationalPanel', routeName: 'intermediary-dashboard' },
                { labelKey: 'nav.intermediaryRequests', routeName: 'intermediary-requests' },
                { labelKey: 'nav.intermediaryRentals', routeName: 'intermediary-rentals' },
                { labelKey: 'nav.intermediaryAlerts', routeName: 'intermediary-alerts' }
            ];
        case 'Maintenance':
            return [
                { labelKey: 'nav.iotMonitor', routeName: 'iot-panel' }
            ];
        default:
            return [];
    }
}

/**
 * Profile route name for the signed-in role.
 *
 * @param {unknown} role
 * @returns {string|null}
 */
export function getProfileRouteForRole(role) {
    switch (normalizeAppRole(role)) {
        case 'Owner':
            return 'owner-profile';
        default:
            return null;
    }
}
