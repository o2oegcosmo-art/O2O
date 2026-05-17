export type TabType = 'overview' | 'calendar' | 'customers' | 'staff' | 'services' | 'settings' | 'ai' | 'billing' | 'market' | 'retail-orders' | 'crm-marketing' | 'whatsapp' | 'finance' | 'marketing' | 'inventory';

export interface Staff {
    id: string;
    name: string;
    specialization: string;
    is_active: boolean;
}

export interface InventoryItem {
    id: string | number;
    name: string;
    sku: string;
    unit: string;
    quantity_in_stock: number;
    cost_per_unit: number;
    price: number;
    is_retail: boolean;
    is_consumable: boolean;
}

export interface ConsultantAdvice {
    summary: string;
    marketing_advice?: string[];
    data_insights?: {
        growth_opportunity: string;
        target_service: string;
    };
    creative_content?: {
        facebook_post: string;
        whatsapp_broadcast: string;
        image_idea: string;
    };
    sales_hack?: string;
    suggested_offer?: {
        title: string;
        details: string;
    };
    setup_warning?: string;
    title?: string;
}

export interface DashboardData {
    user: {
        name: string;
        role: string;
        phone?: string;
    };
    tenant: {
        id: string;
        name: string;
        type: string;
        phone?: string;
        address?: string;
        settings?: {
            accept_cash: boolean;
            accept_wallet?: boolean;
            accept_instapay?: boolean;
            require_deposit: boolean;
            deposit_amount: number;
            payment_instructions: string;
            show_ads?: boolean;
        };
        services: { id: string, name: string, slug: string, status: string, global_status?: string }[];
        google_ai_api_key?: string;
        whatsapp_access_token?: string;
        whatsapp_phone_number_id?: string;
        latitude?: number;
        longitude?: number;
        plan?: { name: string; slug: string };
        onboarding_completed?: boolean;
        has_full_access?: boolean;
        description?: string;
        og_image_url?: string;
    };
    subscription: {
        plan_id: string;
        status: string;
        expires_at: string;
    } | null;
    payments?: {
        id: string | number;
        plan_name: string;
        amount: number;
        created_at: string;
        status: string;
    }[];
}

export interface Plan {
    id: string;
    name: string;
    price: number | string;
    description?: string;
    slug?: string;
    features?: Record<string, boolean>;
}

export interface Booking {
    id: string;
    customer: { name: string; phone?: string };
    service: { name: string };
    staff?: { name: string };
    appointment_at: string;
    status: string;
    price: number;
}

export interface Customer {
    id: string | number;
    name: string;
    phone: string;
    category?: string;
    bookings_count: number;
    created_at: string;
}

export interface Service {
    id: string;
    name: string;
    price: number;
    description?: string;
    status: string;
    image_url?: string;
}

export interface WorkingHour {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_closed: boolean;
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    expense_date: string;
    description?: string;
}

export interface FinanceStats {
    month_name: string;
    current_month: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    previous_month: {
        revenue: number;
        expenses: number;
        profit: number;
    };
}

export interface Transaction {
    type: 'revenue' | 'expense';
    amount: number | string;
    description: string;
    date: string;
}
