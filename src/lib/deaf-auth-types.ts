// Core types for the DeafAuth system

export interface AccessibilityProfile {
  id: string
  user_id: string
  dark_mode: boolean
  motion_safe: boolean
  font_size: number
  high_contrast: boolean
  last_used: Date
  updated_at: Date
}

export interface AuthSession {
  id: string
  user_id: string | null
  current_state: AuthState
  // These will be Date objects when used in context, but might be ISO strings
  // when initially passed from DB or prepared for XState context.
  started_at: Date | string
  completed_at: Date | string | null
  metadata: Record<string, any> // Ensure this is a plain object
  client_info: ClientInfo // Ensure this is a plain object
}

export interface ClientInfo {
  ip_address: string
  user_agent: string
  device_type: "mobile" | "tablet" | "desktop"
  browser: string
}

export interface AuthEvent {
  id: string
  session_id: string
  event_type: string
  state_from: AuthState | null
  state_to: AuthState
  event_data: Record<string, any> // Ensure this is a plain object
  created_at: Date
}

export interface ASLVerificationAttempt {
  id: string
  session_id: string
  success: boolean
  confidence_score: number
  attempt_number: number
  verification_data: Record<string, any> // Ensure this is a plain object
  created_at: Date
}

export type AuthState =
  | "INITIAL"
  | "IDENTIFYING_USER"
  | "AWAITING_ASL_VERIFICATION"
  | "PROCESSING_ASL"
  | "ASL_VERIFICATION_FAILED"
  | "AWAITING_OTP_ENTRY"
  | "VERIFYING_OTP"
  | "AUTHENTICATED"
  | "AUTHENTICATION_FAILED"
  | "SESSION_EXPIRED"

export interface StateMachineContext {
  session: AuthSession
  user_id?: string
  accessibility_profile?: AccessibilityProfile
  asl_attempts: number
  otp_attempts: number
  otp_code?: string
  error_message?: string
}
