import { Region } from "./location"; // Assuming location types exist

export type PropertyType = "apartment" | "house" | "villa" | "townhouse" | "commercial";
export type ListingType = "sale" | "rent";
export type PropertyStatus = "draft" | "published" | "under_offer" | "sold" | "rented";

export interface PropertyImage {
    id: number;
    image_url: string;
    caption: string;
    is_primary: boolean;
    order: number;
}

export interface Property {
    id: number;
    slug: string;
    title: string;
    summary: string;
    description: string;
    property_type: PropertyType;
    listing_type: ListingType;
    status: PropertyStatus;
    price: string;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    area_sq_m: string;
    plot_sq_m: string | null;
    year_built: number | null;
    hero_image_url: string;
    sustainability_score: number;
    energy_rating: number;
    water_rating: number;
    amenities: string[];
    highlights: string[];
    city: string;
    country: string;
    region: any; // Simplified for now
    address: string;
    latitude: string | null;
    longitude: string | null;
    featured: boolean;
    created_at: string;
    updated_at: string;
    images: PropertyImage[];
}

export type TransactionType = "rent" | "lease" | "buy";
export type TransactionStatus =
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "negotiating"
    | "contract_pending"
    | "contract_signed"
    | "payment_pending"
    | "completed"
    | "cancelled";

export interface PropertyTransaction {
    id: string;
    property_ref: Property;
    client: any; // User type
    transaction_type: TransactionType;
    status: TransactionStatus;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    proposed_price: string | null;
    proposed_rent: string | null;
    lease_duration_months: number | null;
    move_in_date: string | null;
    message: string;
    budget: string;
    financing_required: boolean;
    admin_notes: string;
    rejection_reason: string;
    assigned_agent: any; // User type
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    completed_at: string | null;
}

export type ViewingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface ViewingAppointment {
    id: string;
    inquiry: any; // PropertyInquiry type
    property: Property;
    agent: any; // User type
    scheduled_for: string;
    notes: string;
    status: ViewingStatus;
    created_at: string;
    updated_at: string;
}
