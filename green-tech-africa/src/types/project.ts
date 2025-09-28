export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  user_type: string | null;
  is_verified: boolean;
}

export interface ProjectSummary {
  id: number;
  title: string;
  description: string;
  status: string;
  status_display: string;
  current_phase: string;
  phase_display: string;
  progress_percentage: number;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
}

export interface ProjectMilestoneSummary {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
  phase: string;
  progress: number;
  is_due_soon: boolean;
  is_overdue: boolean;
}

export interface ProjectBudgetStatus {
  utilization: number;
  status: 'over_budget' | 'at_risk' | 'under_budget' | 'on_track' | 'not_set';
  remaining: string;
  estimated: string;
  actual: string;
  variance: string;
  is_over_budget: boolean;
  currency?: string;
}

export interface ProjectDocumentVersion {
  id: string;
  version: number;
  notes: string;
  uploaded_at: string;
  uploaded_by: UserSummary | null;
  download_url: string | null;
}

export interface ProjectDocument {
  id: string;
  title: string;
  document_type: string;
  document_type_display: string;
  description: string;
  is_required: boolean;
  requires_upload: boolean;
  current_version: ProjectDocumentVersion | null;
  versions: ProjectDocumentVersion[];
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdateItem {
  id: string;
  title: string;
  body: string;
  category: string;
  is_customer_visible: boolean;
  created_by: UserSummary | null;
  created_at: string;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: UserSummary | null;
  requires_customer_action: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface ProjectRiskItem {
  type: string;
  severity: string;
  description: string;
  impact: string;
  mitigation: string;
}

export interface ProjectPhaseProgress {
  phase: string;
  name: string;
  progress: number;
  milestone_count: number;
  completed_milestones: number;
}

export interface ProjectDashboard {
  id: number;
  title: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  days_remaining: number | null;
  budget_status: ProjectBudgetStatus;
  upcoming_milestones: ProjectMilestoneSummary[];
  recent_activity: ProjectUpdateItem[];
  phase_progress: ProjectPhaseProgress[];
  team_members: Array<{
    id: number;
    name: string;
    role: string;
    email: string;
    phone: string;
    company?: string;
  }>;
  risk_factors: ProjectRiskItem[];
  documents: ProjectDocument[];
  action_items: ProjectTaskItem[];
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_budget: string;
  actual_cost: string;
  currency?: string;
}

export interface ProjectTimelineMilestone {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  completion_percentage: number;
  dependencies: number[];
  is_on_track: boolean;
}

export interface ProjectTimeline {
  project: {
    id: number;
    title: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    current_phase: string;
    progress: number;
  };
  milestones: ProjectTimelineMilestone[];
}
