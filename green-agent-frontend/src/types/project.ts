export interface UserSummary {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  status_display?: string;
  current_phase?: string;
  phase_display?: string;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  progress_percentage?: number;
  project_manager?: UserSummary | null;
  site_supervisor?: UserSummary | null;
}

export type ProjectTaskStatus = "pending" | "in_progress" | "completed" | "blocked";
export type ProjectTaskPriority = "low" | "medium" | "high";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  due_date: string | null;
  assigned_to: UserSummary | null;
  requires_customer_action: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface ProjectUpdateItem {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  is_customer_visible: boolean;
  created_by?: UserSummary;
}

export interface ProjectMilestoneItem {
  id: number | string;
  title: string;
  due_date?: string | null;
  planned_end_date?: string | null;
  status: string;
  phase?: string;
  progress?: number;
  completion_percentage?: number;
  is_due_soon?: boolean;
  is_overdue?: boolean;
}

export interface ProjectDashboardPayload {
  id: string;
  title: string;
  status: string;
  current_phase: string;
  progress_percentage: number;
  days_remaining: number | null;
  budget_status: {
    utilization: number;
    status: string;
    remaining: number;
    estimated: number;
    actual: number;
    variance: number;
    is_over_budget: boolean;
    currency: string;
  };
  upcoming_milestones: ProjectMilestoneItem[];
  recent_activity: ProjectUpdateItem[];
  phase_progress: Array<{
    phase: string;
    name: string;
    progress: number;
    milestone_count: number;
    completed_milestones: number;
  }>;
  team_members: UserSummary[];
  risk_factors: Array<{
    type: string;
    severity: string;
    description: string;
    impact: string;
    mitigation: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    document_type: string;
    document_type_display?: string;
    description: string;
    is_required: boolean;
    requires_upload: boolean;
    current_version: {
      id: string;
      version: string;
      notes: string;
      uploaded_at: string;
      uploaded_by: UserSummary | null;
      download_url: string | null;
    } | null;
    created_at: string;
    updated_at: string;
  }>;
  action_items: ProjectTask[];
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_budget: number;
  actual_cost: number;
  currency: string;
}
