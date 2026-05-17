import { create } from 'zustand';
import { 
    DashboardData, Booking, Service, Customer, Staff, InventoryItem, 
    FinanceStats, Expense, Transaction, TabType 
} from '../types/salon';
import api from '../api/config';

interface SalonState {
    data: DashboardData | null;
    bookings: Booking[];
    services: Service[];
    customers: Customer[];
    staff: Staff[];
    inventory: InventoryItem[];
    financeStats: FinanceStats | null;
    expenses: Expense[];
    transactions: Transaction[];
    activeTab: TabType;
    loading: boolean;
    
    // Actions
    fetchDashboardData: () => Promise<void>;
    setActiveTab: (tab: TabType) => void;
    setBookings: (bookings: Booking[]) => void;
    setServices: (services: Service[]) => void;
    setCustomers: (customers: Customer[]) => void;
    setInventory: (items: InventoryItem[]) => void;
}

export const useSalonStore = create<SalonState>((set, get) => ({
    data: null,
    bookings: [],
    services: [],
    customers: [],
    staff: [],
    inventory: [],
    financeStats: null,
    expenses: [],
    transactions: [],
    activeTab: 'overview',
    loading: true,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setBookings: (bookings) => set({ bookings }),
    setServices: (services) => set({ services }),
    setCustomers: (customers) => set({ customers }),
    setInventory: (inventory) => set({ inventory }),

    fetchDashboardData: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/salon/dashboard');
            const d = res.data.data;
            set({
                data: d,
                bookings: d.bookings || [],
                services: d.services || [],
                customers: d.customers || [],
                staff: d.staff || [],
                inventory: d.inventory || [],
                financeStats: d.finance_stats || null,
                expenses: d.expenses || [],
                transactions: d.transactions || [],
                loading: false
            });
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
            set({ loading: false });
        }
    }
}));
