import { normalizeAppRole } from './user-role.js';

/**
 * Sidebar navigation items per authenticated role.
 * Each item: { labelKey: i18n key, routeName: vue-router name, icon: PrimeIcons class }
 *
 * @param {unknown} role - "Client" | "Owner" | "Intermediary" (any casing)
 * @returns {Array<{ labelKey: string, routeName: string, icon: string }>}
 */
export function getSidebarItemsForRole(role) {
    switch (normalizeAppRole(role)) {
        case 'Client':
            return [
                { labelKey: 'nav.clientMyRequests', routeName: 'client-my-requests', icon: 'pi pi-inbox' },
                { labelKey: 'nav.clientDashboard', routeName: 'client-dashboard', icon: 'pi pi-home' },
                { labelKey: 'nav.catalog', routeName: 'client-catalog', icon: 'pi pi-th-large' }
            ];
        case 'Owner':
            return [
                { labelKey: 'nav.myMachines', routeName: 'owner-machines', icon: 'pi pi-truck' },
                { labelKey: 'nav.ownerActiveRentals', routeName: 'owner-active-rentals', icon: 'pi pi-play' },
                { labelKey: 'nav.ownerEarnings', routeName: 'owner-earnings', icon: 'pi pi-chart-line' },
                { labelKey: 'nav.ownerIotHistory', routeName: 'owner-iot-history', icon: 'pi pi-history' },
                { labelKey: 'nav.ownerProfile', routeName: 'owner-profile', icon: 'pi pi-user' }
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
        default:
            return [];
    }
}
