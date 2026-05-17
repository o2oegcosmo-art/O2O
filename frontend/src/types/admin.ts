export interface Stats {
    mrr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    leadsCount: number;
    salonsCount: number;
    companiesCount: number;
    b2bStats: {
        totalOrders: number;
        totalValue: number;
    };
    growthData: number[];
    aiStats?: {
        totalMessages: number;
        spamAlerts: number;
        aiSuccessRate: number;
        usageByTenant: { name: string, messages: number, status: string, category?: string }[];
        hallucinationAlerts: number;
    }
}

export interface Lead {
    id: string;
    name: string;
    phone: string;
    governorate: string;
    interest_type: string;
    social_link?: string;
    status?: string;
    created_at: string;
}

export interface Tenant {
    id: string;
    name: string;
    domain: string;
    status: string;
    business_category: string;
    logo_url?: string;
    services: { id: string, name: string, slug: string }[];
}

export interface Article {
    id: string;
    title: string;
    category: string;
    content: string;
    image_url: string;
    views?: number;
    created_at: string;
}

export interface PaymentRequest {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    receipt_path: string | null;
    sender_phone: string | null;
    tenant: { name: string };
    subscription?: { plan?: { name: string } };
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    description: string;
    services?: { id: string, name: string }[];
}

export interface SupportTicket {
    id: string;
    salon: string;
    subject: string;
    status: 'pending' | 'open' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    date: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    image_url?: string;
    created_at: string;
    tenant: { id: string; name: string; domain: string };
}

export interface AISecurityLog {
    id: number;
    tenant_name: string;
    feature: string;
    model: string;
    prompt_sent: string;
    response_received: string;
    is_hallucination: boolean;
    security_flags: string;
    created_at: string;
}

export interface AffiliateMarket {
    id: string;
    promo_code: string;
    commission_percentage: number;
    balance: number;
    total_earned: number;
    status: string;
    user: { name: string; email: string; phone: string };
    clicks_count?: number;
    referred_tenants_count?: number;
}

export interface AdminEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    status: 'active' | 'pending' | 'rejected';
    image?: string;
}
