export interface AgentAnalyticsFilters {
  start_date: string | null;
  end_date: string | null;
}

export interface AgentAnalyticsSection {
  total: number;
  status_breakdown: Record<string, number>;
  with_quote?: number;
  active?: number;
  accepted?: number;
  total_value?: string;
  accepted_value?: string;
}

export interface AgentAnalyticsPayload {
  filters: AgentAnalyticsFilters;
  leads: AgentAnalyticsSection;
  quotes: AgentAnalyticsSection;
  projects: AgentAnalyticsSection;
  conversion_rates: Record<string, number>;
}
