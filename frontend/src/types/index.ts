export type UserRole = "author" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  city?: string | null;
  joined_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  author_id: string;
  title: string;
  isbn?: string | null;
  genre: string;
  publication_date?: string | null;
  status: string;
  mrp?: number | null;
  author_royalty_per_copy?: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date?: string | null;
  print_partner?: string | null;
  available_on: string[];
  created_at: string;
}

export interface RoyaltySummary {
  total_earned: number;
  total_paid: number;
  total_pending: number;
  currency: string;
  eligible_for_payout: boolean;
  payout_threshold: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: UserRole;
  sender_name?: string | null;
  message_body: string;
  created_at: string;
}

export interface InternalNote {
  id: string;
  ticket_id: string;
  author_staff_id: string;
  staff_name?: string | null;
  note_text: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  reference_no: string;
  author_id: string;
  author_name?: string | null;
  author_email?: string | null;
  book_id?: string | null;
  book_title?: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  ai_category_suggestion?: string | null;
  ai_priority_suggestion?: string | null;
  ai_rationale?: string | null;
  ai_processing_status: string;
  assigned_to?: string | null;
  assignee_name?: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends Ticket {
  author_phone?: string | null;
  author_city?: string | null;
  author_joined_date?: string | null;
  book?: Book | null;
  messages: TicketMessage[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AIDraftResponse {
  suggested_draft: string;
  grounded_policies_used: string[];
  confidence_score: number;
  model_used: string;
}
