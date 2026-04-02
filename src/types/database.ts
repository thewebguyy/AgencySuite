export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          clerk_org_id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string | null
          billing_country: string | null
          payment_provider: "stripe" | "paystack" | null
          stripe_account_id: string | null
          paystack_public_key: string | null
          specializations: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          clerk_org_id: string
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string | null
          billing_country?: string | null
          payment_provider?: "stripe" | "paystack" | null
          stripe_account_id?: string | null
          paystack_public_key?: string | null
          specializations?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          clerk_org_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string | null
          billing_country?: string | null
          payment_provider?: "stripe" | "paystack" | null
          stripe_account_id?: string | null
          paystack_public_key?: string | null
          specializations?: string[] | null
          created_at?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          agency_id: string
          name: string
          company: string | null
          email: string
          phone: string | null
          country: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          name: string
          company?: string | null
          email: string
          phone?: string | null
          country?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          name?: string
          company?: string | null
          email?: string
          phone?: string | null
          country?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          agency_id: string
          client_id: string
          title: string
          status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | null
          brief_raw: string | null
          executive_summary: string | null
          scope_statement: string | null
          assumptions: string[] | null
          out_of_scope: string[] | null
          total_price: number
          currency: string | null
          timeline_weeks: number | null
          sent_at: string | null
          viewed_at: string | null
          accepted_at: string | null
          pdf_url: string | null
          share_token: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          client_id: string
          title: string
          status?: "draft" | "sent" | "viewed" | "accepted" | "rejected" | null
          brief_raw?: string | null
          executive_summary?: string | null
          scope_statement?: string | null
          assumptions?: string[] | null
          out_of_scope?: string[] | null
          total_price?: number
          currency?: string | null
          timeline_weeks?: number | null
          sent_at?: string | null
          viewed_at?: string | null
          accepted_at?: string | null
          pdf_url?: string | null
          share_token?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          client_id?: string
          title?: string
          status?: "draft" | "sent" | "viewed" | "accepted" | "rejected" | null
          brief_raw?: string | null
          executive_summary?: string | null
          scope_statement?: string | null
          assumptions?: string[] | null
          out_of_scope?: string[] | null
          total_price?: number
          currency?: string | null
          timeline_weeks?: number | null
          sent_at?: string | null
          viewed_at?: string | null
          accepted_at?: string | null
          pdf_url?: string | null
          share_token?: string | null
          created_at?: string | null
        }
      }
      proposal_items: {
        Row: {
          id: string
          proposal_id: string
          sort_order: number
          title: string
          description: string | null
          quantity: number | null
          unit_price: number
          currency: string | null
        }
        Insert: {
          id?: string
          proposal_id: string
          sort_order: number
          title: string
          description?: string | null
          quantity?: number | null
          unit_price: number
          currency?: string | null
        }
        Update: {
          id?: string
          proposal_id?: string
          sort_order?: number
          title?: string
          description?: string | null
          quantity?: number | null
          unit_price?: number
          currency?: string | null
        }
      }
      proposal_phases: {
        Row: {
          id: string
          proposal_id: string
          sort_order: number
          phase_name: string
          duration_weeks: number
          milestones: string[] | null
        }
        Insert: {
          id?: string
          proposal_id: string
          sort_order: number
          phase_name: string
          duration_weeks: number
          milestones?: string[] | null
        }
        Update: {
          id?: string
          proposal_id?: string
          sort_order?: number
          phase_name?: string
          duration_weeks?: number
          milestones?: string[] | null
        }
      }
      contracts: {
        Row: {
          id: string
          agency_id: string
          proposal_id: string | null
          client_id: string
          contract_type: "fixed_price" | "retainer" | "time_and_materials"
          status: "draft" | "sent" | "signed" | "voided" | null
          clauses: Json
          payment_terms: string | null
          revision_policy: string | null
          governing_law: string | null
          sent_at: string | null
          signed_at: string | null
          pdf_url: string | null
          sign_token: string | null
          sign_token_expires: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          proposal_id?: string | null
          client_id: string
          contract_type: "fixed_price" | "retainer" | "time_and_materials"
          status?: "draft" | "sent" | "signed" | "voided" | null
          clauses?: Json
          payment_terms?: string | null
          revision_policy?: string | null
          governing_law?: string | null
          sent_at?: string | null
          signed_at?: string | null
          pdf_url?: string | null
          sign_token?: string | null
          sign_token_expires?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          proposal_id?: string | null
          client_id?: string
          contract_type?: "fixed_price" | "retainer" | "time_and_materials"
          status?: "draft" | "sent" | "signed" | "voided" | null
          clauses?: Json
          payment_terms?: string | null
          revision_policy?: string | null
          governing_law?: string | null
          sent_at?: string | null
          signed_at?: string | null
          pdf_url?: string | null
          sign_token?: string | null
          sign_token_expires?: string | null
        }
      }
      contract_signatures: {
        Row: {
          id: string
          contract_id: string
          signer_type: "agency" | "client"
          signer_name: string
          signer_email: string
          signature_data: string | null
          signature_hash: string | null
          ip_address: string | null
          user_agent: string | null
          signed_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          signer_type: "agency" | "client"
          signer_name: string
          signer_email: string
          signature_data?: string | null
          signature_hash?: string | null
          ip_address?: string | null
          user_agent?: string | null
          signed_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          signer_type?: "agency" | "client"
          signer_name?: string
          signer_email?: string
          signature_data?: string | null
          signature_hash?: string | null
          ip_address?: string | null
          user_agent?: string | null
          signed_at?: string | null
        }
      }
      client_portals: {
        Row: {
          id: string
          agency_id: string
          client_id: string
          contract_id: string | null
          slug: string
          portal_token: string
          is_active: boolean | null
          welcome_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          client_id: string
          contract_id?: string | null
          slug: string
          portal_token: string
          is_active?: boolean | null
          welcome_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          client_id?: string
          contract_id?: string | null
          slug?: string
          portal_token?: string
          is_active?: boolean | null
          welcome_message?: string | null
          created_at?: string | null
        }
      }
      portal_files: {
        Row: {
          id: string
          portal_id: string
          uploaded_by: "agency" | "client"
          file_name: string
          file_url: string
          file_size: number | null
          needs_approval: boolean | null
          approval_status: "pending" | "approved" | "revision_requested" | null
          approved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          portal_id: string
          uploaded_by: "agency" | "client"
          file_name: string
          file_url: string
          file_size?: number | null
          needs_approval?: boolean | null
          approval_status?: "pending" | "approved" | "revision_requested" | null
          approved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          portal_id?: string
          uploaded_by?: "agency" | "client"
          file_name?: string
          file_url?: string
          file_size?: number | null
          needs_approval?: boolean | null
          approval_status?: "pending" | "approved" | "revision_requested" | null
          approved_at?: string | null
          created_at?: string | null
        }
      }
      status_reports: {
        Row: {
          id: string
          agency_id: string
          contract_id: string
          week_number: number
          status: "pending" | "approved" | "sent" | "discarded" | null
          ai_draft: Json | null
          edited_content: Json | null
          email_subject: string | null
          sent_at: string | null
          opened_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          contract_id: string
          week_number: number
          status?: "pending" | "approved" | "sent" | "discarded" | null
          ai_draft?: Json | null
          edited_content?: Json | null
          email_subject?: string | null
          sent_at?: string | null
          opened_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          contract_id?: string
          week_number?: number
          status?: "pending" | "approved" | "sent" | "discarded" | null
          ai_draft?: Json | null
          edited_content?: Json | null
          email_subject?: string | null
          sent_at?: string | null
          opened_at?: string | null
          created_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          agency_id: string
          client_id: string
          proposal_id: string | null
          invoice_number: string
          status: "draft" | "sent" | "paid" | "overdue" | "voided" | null
          currency: string
          subtotal: number
          tax_rate: number | null
          tax_amount: number
          discount_amount: number | null
          total: number
          payment_provider: "stripe" | "paystack"
          payment_url: string | null
          payment_reference: string | null
          due_date: string
          sent_at: string | null
          paid_at: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          client_id: string
          proposal_id?: string | null
          invoice_number: string
          status?: "draft" | "sent" | "paid" | "overdue" | "voided" | null
          currency: string
          subtotal: number
          tax_rate?: number | null
          tax_amount?: number
          discount_amount?: number | null
          total: number
          payment_provider: "stripe" | "paystack"
          payment_url?: string | null
          payment_reference?: string | null
          due_date: string
          sent_at?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          client_id?: string
          proposal_id?: string | null
          invoice_number?: string
          status?: "draft" | "sent" | "paid" | "overdue" | "voided" | null
          currency?: string
          subtotal?: number
          tax_rate?: number | null
          tax_amount?: number
          discount_amount?: number | null
          total?: number
          payment_provider?: "stripe" | "paystack"
          payment_url?: string | null
          payment_reference?: string | null
          due_date?: string
          sent_at?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          sort_order: number
          description: string
          quantity: number | null
          unit_price: number
          amount: number
        }
        Insert: {
          id?: string
          invoice_id: string
          sort_order: number
          description: string
          quantity?: number | null
          unit_price: number
          amount: number
        }
        Update: {
          id?: string
          invoice_id?: string
          sort_order?: number
          description?: string
          quantity?: number | null
          unit_price?: number
          amount?: number
        }
      }
      reports: {
        Row: {
          id: string
          agency_id: string
          client_id: string | null
          agency_name: string
          client_name: string
          reporting_period: string
          services: string[]
          metrics: Json
          wins: string[]
          challenges: string[]
          next_steps: string[]
          tone: string
          generated_content: string | null
          status: "draft" | "generated" | "sent"
          sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          client_id?: string | null
          agency_name: string
          client_name: string
          reporting_period: string
          services?: string[]
          metrics?: Json
          wins?: string[]
          challenges?: string[]
          next_steps?: string[]
          tone?: string
          generated_content?: string | null
          status?: "draft" | "generated" | "sent"
          sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          client_id?: string | null
          agency_name?: string
          client_name?: string
          reporting_period?: string
          services?: string[]
          metrics?: Json
          wins?: string[]
          challenges?: string[]
          next_steps?: string[]
          tone?: string
          generated_content?: string | null
          status?: "draft" | "generated" | "sent"
          sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          agency_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: "trial" | "starter" | "agency_suite" | "scale"
          status: "trialing" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at: string | null
          current_period_end: string | null
          reports_generated_this_month: number
          proposals_generated_this_month: number
          monthly_reset_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          agency_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: "trial" | "starter" | "agency_suite" | "scale"
          status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at?: string | null
          current_period_end?: string | null
          reports_generated_this_month?: number
          proposals_generated_this_month?: number
          monthly_reset_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: "trial" | "starter" | "agency_suite" | "scale"
          status?: "trialing" | "active" | "past_due" | "canceled" | "unpaid"
          trial_ends_at?: string | null
          current_period_end?: string | null
          reports_generated_this_month?: number
          proposals_generated_this_month?: number
          monthly_reset_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
