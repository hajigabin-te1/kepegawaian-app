// Generated from the Supabase project schema (supabase gen types). Do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      appraisal_items: {
        Row: {
          appraisal_id: string
          created_at: string
          id: string
          indicator: string
          realization: string | null
          score: number | null
          sort_order: number
          target: string | null
          updated_at: string
        }
        Insert: {
          appraisal_id: string
          created_at?: string
          id?: string
          indicator: string
          realization?: string | null
          score?: number | null
          sort_order?: number
          target?: string | null
          updated_at?: string
        }
        Update: {
          appraisal_id?: string
          created_at?: string
          id?: string
          indicator?: string
          realization?: string | null
          score?: number | null
          sort_order?: number
          target?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_items_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          period_type: Database["public"]["Enums"]["appraisal_period_type"]
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          period_type: Database["public"]["Enums"]["appraisal_period_type"]
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          period_type?: Database["public"]["Enums"]["appraisal_period_type"]
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      appraisals: {
        Row: {
          appraised_by: string | null
          created_at: string
          employee_id: string
          id: string
          note: string | null
          performance_score: number | null
          period_id: string
          revision_note: string | null
          status: Database["public"]["Enums"]["appraisal_status"]
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          appraised_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          note?: string | null
          performance_score?: number | null
          period_id: string
          revision_note?: string | null
          status?: Database["public"]["Enums"]["appraisal_status"]
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          appraised_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          note?: string | null
          performance_score?: number | null
          period_id?: string
          revision_note?: string | null
          status?: Database["public"]["Enums"]["appraisal_status"]
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "appraisal_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_corrections: {
        Row: {
          attendance_date: string
          check_in_at: string | null
          check_out_at: string | null
          corrected_by: string | null
          created_at: string
          employee_id: string
          id: string
          previous_data: Json | null
          reason: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          attendance_date: string
          check_in_at?: string | null
          check_out_at?: string | null
          corrected_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          previous_data?: Json | null
          reason: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          attendance_date?: string
          check_in_at?: string | null
          check_out_at?: string | null
          corrected_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          previous_data?: Json | null
          reason?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_corrections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          attendance_date: string
          attendance_location_id: string | null
          check_in_accuracy_meters: number | null
          check_in_at: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_out_accuracy_meters: number | null
          check_out_at: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          created_at: string
          employee_id: string
          id: string
          note: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          attendance_date: string
          attendance_location_id?: string | null
          check_in_accuracy_meters?: number | null
          check_in_at?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_accuracy_meters?: number | null
          check_out_at?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          created_at?: string
          employee_id: string
          id?: string
          note?: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          attendance_location_id?: string | null
          check_in_accuracy_meters?: number | null
          check_in_at?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_accuracy_meters?: number | null
          check_out_at?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_attendance_location_id_fkey"
            columns: ["attendance_location_id"]
            isOneToOne: false
            referencedRelation: "attendance_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          change_description: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          change_description?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          change_description?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      award_histories: {
        Row: {
          award_date: string | null
          award_name: string
          awarded_by: string | null
          certificate_path: string | null
          created_at: string
          employee_id: string
          id: string
          updated_at: string
        }
        Insert: {
          award_date?: string | null
          award_name: string
          awarded_by?: string | null
          certificate_path?: string | null
          created_at?: string
          employee_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          award_date?: string | null
          award_name?: string
          awarded_by?: string | null
          certificate_path?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_histories: {
        Row: {
          created_at: string
          decree_number: string | null
          decree_path: string | null
          description: string | null
          effective_date: string
          employee_id: string
          id: string
          sanction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          description?: string | null
          effective_date: string
          employee_id: string
          id?: string
          sanction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          description?: string | null
          effective_date?: string
          employee_id?: string
          id?: string
          sanction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      education_histories: {
        Row: {
          certificate_path: string | null
          created_at: string
          education_level: string
          employee_id: string
          graduation_year: number | null
          id: string
          institution: string
          major: string | null
          updated_at: string
        }
        Insert: {
          certificate_path?: string | null
          created_at?: string
          education_level: string
          employee_id: string
          graduation_year?: number | null
          id?: string
          institution: string
          major?: string | null
          updated_at?: string
        }
        Update: {
          certificate_path?: string | null
          created_at?: string
          education_level?: string
          employee_id?: string
          graduation_year?: number | null
          id?: string
          institution?: string
          major?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: string
          file_path: string
          id: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          employee_id: string
          file_path: string
          id?: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: string
          file_path?: string
          id?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active_status: Database["public"]["Enums"]["employee_active_status"]
          address: string | null
          appointment_date: string | null
          birth_date: string | null
          birth_place: string | null
          category: Database["public"]["Enums"]["employee_category"]
          city: string | null
          created_at: string
          deactivation_reason: string | null
          email: string | null
          employee_number: string | null
          employment_status_code: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          lecturer_number: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          national_id_number: string | null
          phone: string | null
          photo_path: string | null
          position_id: string | null
          postal_code: string | null
          province: string | null
          rank_grade: string | null
          religion: string | null
          service_months: number | null
          service_years: number | null
          updated_at: string
          work_unit_id: string | null
        }
        Insert: {
          active_status?: Database["public"]["Enums"]["employee_active_status"]
          address?: string | null
          appointment_date?: string | null
          birth_date?: string | null
          birth_place?: string | null
          category: Database["public"]["Enums"]["employee_category"]
          city?: string | null
          created_at?: string
          deactivation_reason?: string | null
          email?: string | null
          employee_number?: string | null
          employment_status_code?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          lecturer_number?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          national_id_number?: string | null
          phone?: string | null
          photo_path?: string | null
          position_id?: string | null
          postal_code?: string | null
          province?: string | null
          rank_grade?: string | null
          religion?: string | null
          service_months?: number | null
          service_years?: number | null
          updated_at?: string
          work_unit_id?: string | null
        }
        Update: {
          active_status?: Database["public"]["Enums"]["employee_active_status"]
          address?: string | null
          appointment_date?: string | null
          birth_date?: string | null
          birth_place?: string | null
          category?: Database["public"]["Enums"]["employee_category"]
          city?: string | null
          created_at?: string
          deactivation_reason?: string | null
          email?: string | null
          employee_number?: string | null
          employment_status_code?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          lecturer_number?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          national_id_number?: string | null
          phone?: string | null
          photo_path?: string | null
          position_id?: string | null
          postal_code?: string | null
          province?: string | null
          rank_grade?: string | null
          religion?: string | null
          service_months?: number | null
          service_years?: number | null
          updated_at?: string
          work_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_employment_status_code_fkey"
            columns: ["employment_status_code"]
            isOneToOne: false
            referencedRelation: "employment_statuses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_statuses: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          leave_type_id: string
          quota_days: number
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          leave_type_id: string
          quota_days: number
          updated_at?: string
          used_days?: number
          year: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          leave_type_id?: string
          quota_days?: number
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          name: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          name: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          name?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          document_path: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          total_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          document_path?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason: string
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          total_days: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          document_path?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          category: Database["public"]["Enums"]["leave_category"]
          code: string
          counts_toward_quota: boolean
          created_at: string
          default_annual_quota: number | null
          female_only: boolean
          id: string
          is_active: boolean
          max_months: number | null
          name: string
          requires_document: boolean
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["leave_category"]
          code: string
          counts_toward_quota?: boolean
          created_at?: string
          default_annual_quota?: number | null
          female_only?: boolean
          id?: string
          is_active?: boolean
          max_months?: number | null
          name: string
          requires_document?: boolean
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["leave_category"]
          code?: string
          counts_toward_quota?: boolean
          created_at?: string
          default_annual_quota?: number | null
          female_only?: boolean
          id?: string
          is_active?: boolean
          max_months?: number | null
          name?: string
          requires_document?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      mutations: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          decree_number: string | null
          decree_path: string | null
          effective_date: string
          employee_id: string
          from_position_id: string | null
          from_work_unit_id: string | null
          id: string
          proposed_by: string | null
          reason: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          to_position_id: string | null
          to_work_unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          decree_number?: string | null
          decree_path?: string | null
          effective_date: string
          employee_id: string
          from_position_id?: string | null
          from_work_unit_id?: string | null
          id?: string
          proposed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          to_position_id?: string | null
          to_work_unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          decree_number?: string | null
          decree_path?: string | null
          effective_date?: string
          employee_id?: string
          from_position_id?: string | null
          from_work_unit_id?: string | null
          id?: string
          proposed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          to_position_id?: string | null
          to_work_unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutations_from_position_id_fkey"
            columns: ["from_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutations_from_work_unit_id_fkey"
            columns: ["from_work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutations_to_position_id_fkey"
            columns: ["to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutations_to_work_unit_id_fkey"
            columns: ["to_work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          email_sent_at: string | null
          id: string
          link: string | null
          read_at: string | null
          recipient_user_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_user_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_user_id?: string
          title?: string
        }
        Relationships: []
      }
      pegawai: {
        Row: {
          created_at: string | null
          departemen_id: number | null
          email: string
          id: string
          jabatan_id: number | null
          nama_lengkap: string
          nip: string
          tanggal_bergabung: string | null
        }
        Insert: {
          created_at?: string | null
          departemen_id?: number | null
          email: string
          id?: string
          jabatan_id?: number | null
          nama_lengkap: string
          nip: string
          tanggal_bergabung?: string | null
        }
        Update: {
          created_at?: string | null
          departemen_id?: number | null
          email?: string
          id?: string
          jabatan_id?: number | null
          nama_lengkap?: string
          nip?: string
          tanggal_bergabung?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: never
        }
        Update: {
          code?: string
          description?: string | null
          id?: never
        }
        Relationships: []
      }
      position_histories: {
        Row: {
          created_at: string
          decree_number: string | null
          decree_path: string | null
          employee_id: string
          end_date: string | null
          id: string
          position_id: string | null
          start_date: string
          updated_at: string
          work_unit_id: string | null
        }
        Insert: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          position_id?: string | null
          start_date: string
          updated_at?: string
          work_unit_id?: string | null
        }
        Update: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          position_id?: string | null
          start_date?: string
          updated_at?: string
          work_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_histories_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_histories_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number | null
          name: string
          position_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          name: string
          position_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          name?: string
          position_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profile_change_requests: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          reason: string
          requested_changes: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          reason: string
          requested_changes: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          reason?: string
          requested_changes?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_proposals: {
        Row: {
          created_at: string
          current_position_id: string | null
          current_rank_grade: string | null
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          decree_number: string | null
          decree_path: string | null
          effective_date: string | null
          employee_id: string
          id: string
          promotion_type: Database["public"]["Enums"]["promotion_type"]
          proposed_by: string | null
          proposed_position_id: string | null
          proposed_rank_grade: string | null
          reason: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_position_id?: string | null
          current_rank_grade?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          decree_number?: string | null
          decree_path?: string | null
          effective_date?: string | null
          employee_id: string
          id?: string
          promotion_type: Database["public"]["Enums"]["promotion_type"]
          proposed_by?: string | null
          proposed_position_id?: string | null
          proposed_rank_grade?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_position_id?: string | null
          current_rank_grade?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          decree_number?: string | null
          decree_path?: string | null
          effective_date?: string | null
          employee_id?: string
          id?: string
          promotion_type?: Database["public"]["Enums"]["promotion_type"]
          proposed_by?: string | null
          proposed_position_id?: string | null
          proposed_rank_grade?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_proposals_current_position_id_fkey"
            columns: ["current_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_proposals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_proposals_proposed_position_id_fkey"
            columns: ["proposed_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_histories: {
        Row: {
          created_at: string
          decree_number: string | null
          decree_path: string | null
          effective_date: string
          employee_id: string
          id: string
          rank_grade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          effective_date: string
          employee_id: string
          id?: string
          rank_grade: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decree_number?: string | null
          decree_path?: string | null
          effective_date?: string
          employee_id?: string
          id?: string
          rank_grade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      report_scopes: {
        Row: {
          created_at: string
          employee_category:
            | Database["public"]["Enums"]["employee_category"]
            | null
          id: string
          reports: string[]
          user_id: string
          work_unit_id: string | null
        }
        Insert: {
          created_at?: string
          employee_category?:
            | Database["public"]["Enums"]["employee_category"]
            | null
          id?: string
          reports?: string[]
          user_id: string
          work_unit_id?: string | null
        }
        Update: {
          created_at?: string
          employee_category?:
            | Database["public"]["Enums"]["employee_category"]
            | null
          id?: string
          reports?: string[]
          user_id?: string
          work_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_scopes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_scopes_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: number
          role_id: number
        }
        Insert: {
          permission_id: number
          role_id: number
        }
        Update: {
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      training_histories: {
        Row: {
          certificate_path: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          organizer: string | null
          start_date: string | null
          training_id: string | null
          training_name: string
          updated_at: string
        }
        Insert: {
          certificate_path?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          organizer?: string | null
          start_date?: string | null
          training_id?: string | null
          training_name: string
          updated_at?: string
        }
        Update: {
          certificate_path?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          organizer?: string | null
          start_date?: string | null
          training_id?: string | null
          training_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_histories_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_registrations: {
        Row: {
          certificate_path: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          employee_id: string
          id: string
          result_note: string | null
          status: Database["public"]["Enums"]["training_registration_status"]
          training_id: string
          updated_at: string
        }
        Insert: {
          certificate_path?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          employee_id: string
          id?: string
          result_note?: string | null
          status?: Database["public"]["Enums"]["training_registration_status"]
          training_id: string
          updated_at?: string
        }
        Update: {
          certificate_path?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          employee_id?: string
          id?: string
          result_note?: string | null
          status?: Database["public"]["Enums"]["training_registration_status"]
          training_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_registrations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_registrations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          organizer: string | null
          quota: number | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["training_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          organizer?: string | null
          quota?: number | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organizer?: string | null
          quota?: number | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean
          role_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id: string
          is_active?: boolean
          role_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          role_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accounts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          check_in_time: string
          check_out_time: string
          created_at: string
          employee_category: Database["public"]["Enums"]["employee_category"]
          flags_early_leave: boolean
          id: string
          late_tolerance_minutes: number
          name: string
          updated_at: string
        }
        Insert: {
          check_in_time: string
          check_out_time: string
          created_at?: string
          employee_category: Database["public"]["Enums"]["employee_category"]
          flags_early_leave?: boolean
          id?: string
          late_tolerance_minutes?: number
          name: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          employee_category?: Database["public"]["Enums"]["employee_category"]
          flags_early_leave?: boolean
          id?: string
          late_tolerance_minutes?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          unit_type: Database["public"]["Enums"]["work_unit_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          unit_type?: Database["public"]["Enums"]["work_unit_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          unit_type?: Database["public"]["Enums"]["work_unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_monthly_summary: {
        Row: {
          days_absent: number | null
          days_early_leave: number | null
          days_late: number | null
          days_on_leave: number | null
          days_on_permit: number | null
          days_present: number | null
          employee_id: string | null
          month: string | null
          work_unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_summary: {
        Row: {
          approved_days: number | null
          approved_requests: number | null
          employee_id: string | null
          leave_type_id: string | null
          pending_requests: number | null
          work_unit_id: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_work_unit_id_fkey"
            columns: ["work_unit_id"]
            isOneToOne: false
            referencedRelation: "work_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_timezone: { Args: never; Returns: string }
      can_report_on: {
        Args: {
          report_name: string
          target_category: Database["public"]["Enums"]["employee_category"]
          target_unit: string
        }
        Returns: boolean
      }
      can_view_employee: {
        Args: { permission_code: string; target_employee_id: string }
        Returns: boolean
      }
      check_in: {
        Args: { accuracy_meters?: number; lat: number; lon: number }
        Returns: {
          attendance_date: string
          attendance_location_id: string | null
          check_in_accuracy_meters: number | null
          check_in_at: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_out_accuracy_meters: number | null
          check_out_at: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          created_at: string
          employee_id: string
          id: string
          note: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_out: {
        Args: { accuracy_meters?: number; lat: number; lon: number }
        Returns: {
          attendance_date: string
          attendance_location_id: string | null
          check_in_accuracy_meters: number | null
          check_in_at: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_out_accuracy_meters: number | null
          check_out_at: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          created_at: string
          employee_id: string
          id: string
          note: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_attendance: {
        Args: {
          corrected_check_in_at: string
          corrected_check_out_at: string
          corrected_status: Database["public"]["Enums"]["attendance_status"]
          correction_reason: string
          target_date: string
          target_employee_id: string
        }
        Returns: undefined
      }
      current_employee_id: { Args: never; Returns: string }
      get_leave_balance: {
        Args: { target_employee_id: string; target_year: number }
        Returns: {
          pending: number
          quota: number
          remaining: number
          used: number
        }[]
      }
      submit_leave_request: {
        Args: {
          attachment_path?: string
          request_end: string
          request_reason: string
          request_start: string
          request_type_id: string
        }
        Returns: string
      }
      cancel_leave_request: { Args: { request_id: string }; Returns: undefined }
      decide_leave_request: {
        Args: { approve: boolean; note?: string; request_id: string }
        Returns: undefined
      }
      decide_training_registration: {
        Args: { approve: boolean; note?: string; registration_id: string }
        Returns: undefined
      }
      distance_meters: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      execute_mutation: { Args: { mutation_id: string }; Returns: undefined }
      find_attendance_location: {
        Args: { lat: number; lon: number }
        Returns: string
      }
      save_appraisal: {
        Args: { items: Json; new_note: string; target_appraisal_id: string }
        Returns: undefined
      }
      submit_appraisal: { Args: { target_appraisal_id: string }; Returns: undefined }
      generate_appraisals: {
        Args: { target_period_id: string }
        Returns: number
      }
      submit_profile_change_request: {
        Args: { changes: Json; request_reason: string }
        Returns: string
      }
      decide_profile_change_request: {
        Args: { approve: boolean; note?: string; request_id: string }
        Returns: undefined
      }
      has_permission: { Args: { permission_code: string }; Returns: boolean }
      has_report_access: { Args: { report_name: string }; Returns: boolean }
      list_linkable_employees: {
        Args: { for_account_id?: string }
        Returns: {
          employee_number: string
          full_name: string
          id: string
        }[]
      }
      list_user_accounts: {
        Args: never
        Returns: {
          created_at: string
          email: string
          employee_id: string
          employee_name: string
          id: string
          is_active: boolean
          last_sign_in_at: string
          role_code: string
          role_id: number
          role_name: string
        }[]
      }
      log_audit_event: {
        Args: {
          description?: string
          event_action: string
          event_entity: string
          event_entity_id?: string
        }
        Returns: undefined
      }
      notify_employee: {
        Args: {
          notification_body: string
          notification_link?: string
          notification_title: string
          target_employee_id: string
        }
        Returns: undefined
      }
      notify_permission_holders: {
        Args: {
          notification_body: string
          notification_link?: string
          notification_title: string
          permission_code: string
        }
        Returns: undefined
      }
      report_appraisal_by_unit: {
        Args: { target_period_id: string }
        Returns: {
          appraised_employees: number
          average_score: number
          category: Database["public"]["Enums"]["employee_category"]
          highest_score: number
          lowest_score: number
          work_unit_id: string
          work_unit_name: string
        }[]
      }
      report_attendance_by_unit: {
        Args: { target_month: string }
        Returns: {
          category: Database["public"]["Enums"]["employee_category"]
          days_absent: number
          days_early_leave: number
          days_late: number
          days_present: number
          employees_recorded: number
          work_unit_id: string
          work_unit_name: string
        }[]
      }
      report_employee_statistics: {
        Args: never
        Returns: {
          active_employees: number
          category: Database["public"]["Enums"]["employee_category"]
          inactive_employees: number
          parent_id: string
          retired_employees: number
          unit_type: Database["public"]["Enums"]["work_unit_type"]
          work_unit_id: string
          work_unit_name: string
        }[]
      }
      report_full_access_permission: {
        Args: { report_name: string }
        Returns: string
      }
      report_leave_by_unit: {
        Args: { target_year: number }
        Returns: {
          approved_days: number
          approved_requests: number
          category: Database["public"]["Enums"]["employee_category"]
          leave_type_name: string
          pending_requests: number
          work_unit_id: string
          work_unit_name: string
        }[]
      }
      review_appraisal: {
        Args: { accept: boolean; note?: string; target_appraisal_id: string }
        Returns: undefined
      }
      unit_is_within: {
        Args: { scope_unit: string; target_unit: string }
        Returns: boolean
      }
    }
    Enums: {
      appraisal_period_type: "annual" | "semester"
      appraisal_status:
        | "draft"
        | "submitted"
        | "revision_requested"
        | "verified"
      attendance_source: "gps" | "manual"
      attendance_status:
        | "present"
        | "late"
        | "early_leave"
        | "late_and_early_leave"
        | "absent"
        | "on_leave"
        | "on_permit"
      employee_active_status: "active" | "inactive" | "retired"
      employee_category: "lecturer" | "staff"
      gender: "male" | "female"
      leave_category: "leave" | "permit"
      marital_status: "single" | "married" | "divorced" | "widowed"
      promotion_type: "rank" | "position"
      proposal_status: "proposed" | "approved" | "rejected" | "executed"
      request_status: "pending" | "approved" | "rejected" | "cancelled"
      training_registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "selected"
        | "not_selected"
        | "completed"
      training_status: "open" | "closed" | "completed" | "cancelled"
      work_unit_type:
        | "field"
        | "faculty"
        | "study_program"
        | "bureau"
        | "section"
        | "technical_unit"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appraisal_period_type: ["annual", "semester"],
      appraisal_status: [
        "draft",
        "submitted",
        "revision_requested",
        "verified",
      ],
      attendance_source: ["gps", "manual"],
      attendance_status: [
        "present",
        "late",
        "early_leave",
        "late_and_early_leave",
        "absent",
        "on_leave",
        "on_permit",
      ],
      employee_active_status: ["active", "inactive", "retired"],
      employee_category: ["lecturer", "staff"],
      gender: ["male", "female"],
      leave_category: ["leave", "permit"],
      marital_status: ["single", "married", "divorced", "widowed"],
      promotion_type: ["rank", "position"],
      proposal_status: ["proposed", "approved", "rejected", "executed"],
      request_status: ["pending", "approved", "rejected", "cancelled"],
      training_registration_status: [
        "pending",
        "approved",
        "rejected",
        "selected",
        "not_selected",
        "completed",
      ],
      training_status: ["open", "closed", "completed", "cancelled"],
      work_unit_type: [
        "field",
        "faculty",
        "study_program",
        "bureau",
        "section",
        "technical_unit",
        "other",
      ],
    },
  },
} as const
