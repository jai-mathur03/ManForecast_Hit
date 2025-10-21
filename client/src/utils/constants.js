export const USER_ROLES = {
  ADMIN: 'admin',
  HOD: 'hod',
  FINANCE: 'finance'
};

export const FORECAST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const QUARTERS = [
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' }
];

export const YEARS = [2023, 2024, 2025, 2026];

export const WORKFORCE_TYPES = [
  { value: 'FT', label: 'Full Time' },
  { value: 'PT', label: 'Part Time' },
  { value: 'CT', label: 'Contract' }
];

export const EMPLOYEE_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' }
];

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// RATING SCALES (1-5)
export const RATING_OPTIONS = [
  { value: 1, label: '1 - Very Poor' },
  { value: 2, label: '2 - Poor' },
  { value: 3, label: '3 - Average' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' }
];

export const COMPETITIVENESS_LABELS = {
  1: 'Well Below Market',
  2: 'Below Market', 
  3: 'Market Rate',
  4: 'Above Market',
  5: 'Well Above Market'
};

export const SKILLS_GAP_LABELS = {
  1: 'Very Easy to Replace',
  2: 'Easy to Replace',
  3: 'Moderate Difficulty',
  4: 'Hard to Replace',
  5: 'Very Hard to Replace'
};

export const MARKET_DEMAND_LABELS = {
  1: 'Very Low Demand',
  2: 'Low Demand',
  3: 'Moderate Demand', 
  4: 'High Demand',
  5: 'Very High Demand'
};
