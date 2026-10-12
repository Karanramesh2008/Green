/**
 * Fictional sample presets for testing transactions and scam messages.
 * All data in this file is strictly fictional and synthetic.
 */

import type { TransactionInput } from './types.ts';

export interface TransactionPreset {
  id: string;
  title: string;
  subtitle: string;
  data: TransactionInput;
  expectedScore: number;
  expectedBand: 'low' | 'medium' | 'high';
}

export interface MessagePreset {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  expectedBand: 'low' | 'medium' | 'high';
  primaryThreats: string[];
}

export const TRANSACTION_PRESETS: TransactionPreset[] = [
  {
    id: 'routine-purchase',
    title: 'Routine Coffee & Groceries',
    subtitle: 'Familiar device, matching country, baseline amount',
    data: {
      amount: 42.5,
      baselineAmount: 50.0,
      country: 'US',
      usualCountry: 'US',
      newDevice: false,
      billingShippingMismatch: false,
      attemptsLast10m: 1,
      declinesLast24h: 0,
      accountAgeDays: 240,
    },
    expectedScore: 0,
    expectedBand: 'low',
  },
  {
    id: 'device-and-location-shift',
    title: 'New Device & International Shift',
    subtitle: 'Trip to Canada on new mobile phone (Score: 35)',
    data: {
      amount: 110.0,
      baselineAmount: 100.0,
      country: 'CA',
      usualCountry: 'US',
      newDevice: true,
      billingShippingMismatch: false,
      attemptsLast10m: 1,
      declinesLast24h: 0,
      accountAgeDays: 450,
    },
    expectedScore: 35,
    expectedBand: 'medium',
  },
  {
    id: 'velocity-retry-burst',
    title: 'Velocity Burst & Multiple Declines',
    subtitle: 'Card testing pattern with 4 retries & 3 declines',
    data: {
      amount: 75.0,
      baselineAmount: 60.0,
      country: 'US',
      usualCountry: 'US',
      newDevice: false,
      billingShippingMismatch: false,
      attemptsLast10m: 4,
      declinesLast24h: 3,
      accountAgeDays: 120,
    },
    expectedScore: 24,
    expectedBand: 'low',
  },
  {
    id: 'account-takeover-spike',
    title: 'High-Risk Account Takeover Pattern',
    subtitle: '6x baseline amount, new device, foreign IP, mismatch',
    data: {
      amount: 650.0,
      baselineAmount: 100.0,
      country: 'GB',
      usualCountry: 'US',
      newDevice: true,
      billingShippingMismatch: true,
      attemptsLast10m: 5,
      declinesLast24h: 3,
      accountAgeDays: 3,
    },
    expectedScore: 100, // Capped at 100 (sum is 25+20+15+12+20+12+10 = 114)
    expectedBand: 'high',
  },
  {
    id: 'sparse-new-user',
    title: 'Sparse Profile: Missing Baseline & History',
    subtitle: 'Brand new account under 7 days with only required fields',
    data: {
      amount: 120.0,
      baselineAmount: null,
      country: null,
      usualCountry: null,
      newDevice: false,
      billingShippingMismatch: false,
      attemptsLast10m: 1,
      declinesLast24h: 0,
      accountAgeDays: 4,
    },
    expectedScore: 10,
    expectedBand: 'low',
  },
];

export const MESSAGE_PRESETS: MessagePreset[] = [
  {
    id: 'urgent-bank-lockout',
    title: 'Urgent Bank Lockout & OTP Phishing',
    subtitle: 'Classic brand spoof with link shortener & urgency',
    text: 'URGENT: Your Chase account will be locked within 24 hours due to unauthorized activity. Action required immediately! Verify your identity and share your one-time passcode (OTP) at https://bit.ly/chase-auth-9812 to prevent suspension.',
    expectedBand: 'high',
    primaryThreats: ['Credential/OTP solicitation', 'Account lockout threat', 'URL shortener', 'Brand impersonation'],
  },
  {
    id: 'gift-card-impostor',
    title: 'Gift Card / Wire Transfer Extortion',
    subtitle: 'Demands irreversible payment with strict secrecy',
    text: 'Final notice from official department: To resolve your outstanding ticket immediately, please purchase $500 in Apple gift cards or wire transfer funds via Western Union. Keep this strictly confidential and do not inform your bank.',
    expectedBand: 'high',
    primaryThreats: ['Gift card/wire transfer demand', 'Secrecy demand', 'Coercive urgency'],
  },
  {
    id: 'sensitive-financial-harvest',
    title: 'Social Security / Card CVV Solicitation',
    subtitle: 'Direct request for sensitive identity markers',
    text: 'Security breach detected on your profile. Please reply with your Social Security Number and the CVV security code on the back of your credit card to confirm cardholder status.',
    expectedBand: 'high',
    primaryThreats: ['SSN / CVV harvesting', 'Security scare tactics'],
  },
  {
    id: 'benign-calendar-urgent',
    title: 'Benign Urgency: Team Standup Notice',
    subtitle: 'Uses urgent language but contains zero scam cues',
    text: 'Urgent reminder to engineering team: Our sprint retro starts immediately in Conference Room B. Please join now so we can wrap up on time.',
    expectedBand: 'low',
    primaryThreats: ['Routine calendar alert', 'Low score (+15 urgency only)'],
  },
  {
    id: 'benign-order-update',
    title: 'Benign Notification: Shipping Update',
    subtitle: 'Safe routine customer notification without links or threats',
    text: 'Hello Taylor, your bookstore order #49102 has shipped via standard courier and is estimated to arrive on Thursday. Thank you for your support!',
    expectedBand: 'low',
    primaryThreats: ['Clean baseline message', 'Score: 0'],
  },
];
