/**
 * Constants and rules configuration for Transaction and Message Risk Scoring.
 * All weights and rules are fully explainable, transparent, and deterministic.
 */

export const BANDS = {
  LOW: {
    name: 'low' as const,
    min: 0,
    max: 29,
    label: 'Low Risk',
    color: 'emerald',
    description: 'Minimal risk indicators detected; suitable for automated/standard processing.',
  },
  MEDIUM: {
    name: 'medium' as const,
    min: 30,
    max: 59,
    label: 'Medium Risk',
    color: 'amber',
    description: 'Elevated risk indicators present; flagged for human triage and review.',
  },
  HIGH: {
    name: 'high' as const,
    min: 60,
    max: 100,
    label: 'High Risk',
    color: 'rose',
    description: 'Substantial suspicious patterns detected; prioritize immediate specialist review.',
  },
} as const;

export const REVIEW_THRESHOLD = 30;

/**
 * Transaction scoring rule definitions and weight constants
 */
export const TRANSACTION_RULES = {
  AMOUNT_SPIKE_5X: {
    code: 'amount_spike_5x',
    points: 25,
    description: 'Transaction amount is 5x or greater than supplied customer baseline',
  },
  AMOUNT_SPIKE_3X: {
    code: 'amount_spike_3x',
    points: 18,
    description: 'Transaction amount is 3x to 5x of supplied customer baseline',
  },
  AMOUNT_SPIKE_2X: {
    code: 'amount_spike_2x',
    points: 10,
    description: 'Transaction amount is 2x to 3x of supplied customer baseline',
  },
  COUNTRY_MISMATCH: {
    code: 'country_mismatch',
    points: 20,
    description: 'Transaction country differs from usual customer country',
  },
  NEW_DEVICE: {
    code: 'new_device',
    points: 15,
    description: 'Transaction is from a device not previously seen',
  },
  BILLING_SHIPPING_MISMATCH: {
    code: 'billing_shipping_mismatch',
    points: 12,
    description: 'Billing address does not match shipping destination',
  },
  VELOCITY_ATTEMPTS_HIGH: {
    code: 'velocity_attempts_high',
    points: 20,
    description: 'High velocity: 5 or more payment attempts in the last 10 minutes',
  },
  VELOCITY_ATTEMPTS_ELEVATED: {
    code: 'velocity_attempts_elevated',
    points: 12,
    description: 'Elevated velocity: 3 to 4 payment attempts in the last 10 minutes',
  },
  DECLINES_HIGH: {
    code: 'declines_high',
    points: 20,
    description: 'Multiple recent failures: 5 or more payment declines in the last 24 hours',
  },
  DECLINES_ELEVATED: {
    code: 'declines_elevated',
    points: 12,
    description: 'Frequent recent failures: 3 to 4 payment declines in the last 24 hours',
  },
  ACCOUNT_AGE_NEW: {
    code: 'account_younger_than_7_days',
    points: 10,
    description: 'Account was registered less than 7 days ago',
  },
} as const;

/**
 * Message scam-detection rule definitions, regex patterns, and weights
 */
export interface MessageRuleDefinition {
  code: string;
  category: string;
  label: string;
  points: number;
  description: string;
  patterns: RegExp[];
}

export const MESSAGE_RULES: Record<string, MessageRuleDefinition> = {
  CREDENTIAL_OTP_REQUEST: {
    code: 'credential_otp_request',
    category: 'Authentication Credentials',
    label: 'Credential / OTP Solicitation',
    points: 25,
    description: 'Explicit solicitation of one-time password, PIN, verification code, or seed phrase',
    patterns: [
      /\b(one[-\s]?time\s*(pass(?:word|code)|pin|code))\b/i,
      /\b(otp|2fa|mfa)\s*(code|pin|number)?\b/i,
      /\b(verification|security|auth(?:entication)?)\s*code\b/i,
      /\b(share|send|provide|reply\s*with|enter)\s*(your)?\s*(password|pin|passcode|otp|code)\b/i,
      /\b(seed\s*phrase|recovery\s*(phrase|words)|private\s*key)\b/i,
    ],
  },
  UNUSUAL_PAYMENT_METHOD: {
    code: 'unusual_payment_method',
    category: 'Payment Routing',
    label: 'Irreversible / Non-Standard Payment',
    points: 25,
    description: 'Demands payment via gift card, cryptocurrency, or wire transfer service',
    patterns: [
      /\b(apple|google\s*play|steam|amazon|target|ebay|vanilla|razer)\s*(gift\s*card|voucher)s?\b/i,
      /\b(gift\s*cards?|e-gift\s*card)\b/i,
      /\b(bitcoin|btc|ethereum|eth|crypto(?:currency)?|tether|usdt)\s*(wallet|address|transfer)?\b/i,
      /\b(wire\s*transfer|western\s*union|moneygram|cash\s*app\s*tag|zelle\s*transfer)\b/i,
    ],
  },
  THREAT_SUSPENSION_COERCION: {
    code: 'threat_suspension_coercion',
    category: 'Coercive Threats',
    label: 'Account Suspension / Threat of Action',
    points: 20,
    description: 'Threatens account termination, suspension, legal action, or law enforcement',
    patterns: [
      /\b(account\s*(will\s*be|is|has\s*been)?\s*(suspended|locked|terminated|disabled|frozen|closed))\b/i,
      /\b(unauthorized\s*(access|login|transaction|charges?|activity)\s*(detected)?)\b/i,
      /\b(legal\s*action|law\s*enforcement|arrest\s*warrant|court\s*order|sheriff|police)\b/i,
      /\b(prevent\s*(suspension|closure|deactivation)|avoid\s*service\s*interruption)\b/i,
      /\b(security\s*breach|flagged\s*for\s*(fraud|suspicious\s*activity))\b/i,
    ],
  },
  SENSITIVE_DATA_REQUEST: {
    code: 'sensitive_data_request',
    category: 'Personal Identifiers',
    label: 'Sensitive Personal / Financial Data Request',
    points: 20,
    description: 'Requests sensitive identity or card information (SSN, CVV, bank account)',
    patterns: [
      /\b(social\s*security\s*(number)?|ssn|national\s*id)\b/i,
      /\b(credit\s*card|debit\s*card)\s*(number|details|info)\b/i,
      /\b(cvv|cvc|security\s*code\s*on\s*(the\s*)?back|expiration\s*date)\b/i,
      /\b(routing\s*number|bank\s*account\s*(number)?)\b/i,
      /\b(mother'?s\s*maiden\s*name|date\s*of\s*birth|dob)\b/i,
    ],
  },
  SUSPICIOUS_URL: {
    code: 'suspicious_url',
    category: 'Link Topology',
    label: 'Suspicious / Obfuscated Link Format',
    points: 22,
    description: 'Contains known URL shortener, raw IP address host, or suspicious domain',
    patterns: [
      /\b(https?:\/\/(?:www\.)?(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|ow\.ly|buff\.ly|rebrand\.ly|cutt\.ly|tiny\.cc)[^\s]*)/i,
      /\b(https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?[^\s]*)/i,
      /\b(https?:\/\/[^\s]*xn--[^\s]*)/i,
      /\b(https?:\/\/[^\s/]+\.(?:xyz|top|work|click|country|tk|ml|ga|cf|gq|rest|buzz|icu)[^\s]*)/i,
    ],
  },
  BRAND_WITH_LINK: {
    code: 'brand_with_link',
    category: 'Brand Impersonation',
    label: 'Brand / Institution Paired With Link',
    points: 18,
    description: 'Prominent brand or financial entity paired with an action URL in message body',
    patterns: [
      // Matches brand name followed/preceded by link in the same message
      /\b(paypal|chase|bank\s*of\s*america|wells\s*fargo|citibank|apple|amazon|netflix|usps|fedex|ups|irs|dhl)\b[^\n\r]*?(?:https?:\/\/|www\.|bit\.ly|click\s*here|link\s*below)/i,
      /(?:https?:\/\/|www\.|bit\.ly|click\s*here|link\s*below)[^\n\r]*?\b(paypal|chase|bank\s*of\s*america|wells\s*fargo|citibank|apple|amazon|netflix|usps|fedex|ups|irs|dhl)\b/i,
    ],
  },
  URGENCY_DEADLINE: {
    code: 'urgency_deadline',
    category: 'Urgency Signals',
    label: 'Urgent Action / Short Deadline',
    points: 15,
    description: 'Appeals to artificial urgency, immediate action, or expiring deadlines',
    patterns: [
      /\b(act\s*now|immediate(?:ly)?|urgent(?:ly)?|urgency|action\s*required)\b/i,
      /\b(within\s*(?:10|15|24|48)?\s*(?:hours|hrs|minutes|mins))\b/i,
      /\b(expires?\s*(today|tonight|soon|in\s*\d+\s*(hours|minutes)?))\b/i,
      /\b(last\s*chance|final\s*(notice|warning|reminder)|time\s*is\s*running\s*out)\b/i,
    ],
  },
  SECRECY_REQUEST: {
    code: 'secrecy_request',
    category: 'Social Engineering',
    label: 'Request for Secrecy / Confidentiality',
    points: 15,
    description: 'Requests user keep communication secret or refrain from notifying bank/family',
    patterns: [
      /\b(do\s*not|don'?t)\s*(tell|inform|mention|discuss\s*with)\s*(anyone|your\s*bank|family|friends|colleagues)\b/i,
      /\b(keep\s*(this)?\s*(confidential|secret|between\s*us|private))\b/i,
      /\b(do\s*not\s*contact\s*(customer\s*support|your\s*bank|branch))\b/i,
      /\b(strictly\s*confidential)\b/i,
    ],
  },
};
