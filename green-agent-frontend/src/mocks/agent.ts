export type Lead = { id: string; title: string; from: string; type: 'request' | 'inquiry'; requestId?: string; receivedAt: string; status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'closed' };
export type AgentQuote = { id: string; requestId?: string; leadId?: string; total: number; currency: string; status: 'draft' | 'sent' | 'accepted' | 'expired'; sentAt?: string };
export type AgentProject = { id: string; title: string; status: 'planning' | 'in_progress' | 'on_hold' | 'completed'; nextMilestone?: string };
export type AgentEvent = { id: string; title: string; when: string; location: string };

export const LEADS: Lead[] = [
  { id: 'L-1001', title: 'RTB • Green Valley Villa', from: 'customer@domain.com', type: 'request', requestId: 'REQ-1024', receivedAt: '2025-03-10', status: 'new' },
  { id: 'L-1000', title: 'Inquiry • Luxury Waterfront Villa', from: 'buyer@domain.com', type: 'inquiry', receivedAt: '2025-03-09', status: 'contacted' },
];

export const AGENT_QUOTES_SEED: AgentQuote[] = [
  { id: 'QUO-551', requestId: 'REQ-1017', total: 125000, currency: 'USD', status: 'sent', sentAt: '2025-03-09' },
];

export const AGENT_PROJECTS_SEED: AgentProject[] = [
  { id: 'PRJ-88', title: 'Urban Duplex A2 - Lagos', status: 'in_progress', nextMilestone: 'Foundation pour (Mar 22)' },
];

export const EVENTS: AgentEvent[] = [
  { id: 'EV-1', title: 'Site viewing - Riverside Estate', when: '2025-03-15 10:00', location: 'Nairobi' },
  { id: 'EV-2', title: 'PM call - Urban Duplex A2', when: '2025-03-17 14:00', location: 'Online' },
];
