export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

export type QuoteLineItem = {
  id: string;
  kind: 'base' | 'option' | 'allowance' | 'adjustment';
  label: string;
  quantity: number;
  unit_cost: number;
  apply_region_multiplier: boolean;
  calculated_total: number;
  position: number;
};

export type QuoteTimelineEntry = {
  status: QuoteStatus;
  label: string;
  timestamp: string;
};

export type QuoteSummary = {
  id: string;
  reference: string;
  status: QuoteStatus;
  status_display: string;
  currency_code: string;
  subtotal_amount: number;
  allowance_amount: number;
  adjustment_amount: number;
  total_amount: number;
  regional_multiplier: number;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_slug: string;
  build_request: string;
  build_request_summary: {
    id: string;
    plan: {
      name: string;
      slug: string;
      base_price: string;
    };
    region: {
      name: string;
      slug: string;
      currency: string;
      multiplier: string;
    };
    contact: {
      name: string;
      email: string;
    };
  };
  valid_until: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteDetail = QuoteSummary & {
  notes: string;
  terms: string;
  prepared_by_name: string | null;
  prepared_by_email: string | null;
  recipient_name: string;
  recipient_email: string;
  items: QuoteLineItem[];
  document_html: string;
  timeline: QuoteTimelineEntry[];
};
