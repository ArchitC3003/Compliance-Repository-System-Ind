/**
 * ERM Header Preset — optional template for sub-repository creation.
 * Each header has: name, type (text | dropdown | date | number), values (for dropdown type).
 * This is NOT a forced schema — users can create sub-repos with any custom headers.
 */
export const ERM_HEADER_PRESET = [
  { name: 'S. No.', type: 'number', values: [] },
  { name: 'Central/State', type: 'dropdown', values: ['Central', 'State', 'Both'] },
  { name: 'Law Category', type: 'dropdown', values: ['Labour Law', 'Data Protection', 'Corporate Law', 'Environmental Law', 'Financial Regulation', 'Taxation', 'Sector-Specific', 'General', 'Other'] },
  { name: 'Legislation/Act', type: 'text', values: [] },
  { name: 'Rule/Regulation', type: 'text', values: [] },
  { name: 'Section/Rule', type: 'text', values: [] },
  { name: 'Compliance Type', type: 'dropdown', values: ['Mandatory', 'Conditional', 'Prohibition', 'Procedural', 'Reporting', 'Disclosure', 'One-time'] },
  { name: 'Compliance Applicability', type: 'text', values: [] },
  { name: 'Compliance Title', type: 'text', values: [] },
  { name: 'Compliance Requirement', type: 'text', values: [] },
  { name: 'Additional Information', type: 'text', values: [] },
  { name: 'Frequency', type: 'dropdown', values: ['Ongoing', 'Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Event-based', 'One-time', 'Five-Yearly', 'As prescribed'] },
  { name: 'Due Date', type: 'date', values: [] },
  { name: 'Compliance Proof', type: 'text', values: [] },
  { name: 'Penalty', type: 'text', values: [] },
  { name: 'Risk as per Law', type: 'dropdown', values: ['High', 'Medium', 'Low'] },
  { name: 'Risk on Business', type: 'dropdown', values: ['High', 'Medium', 'Low'] },
  { name: 'Department/Authority', type: 'text', values: [] },
];

/**
 * Flat header names — convenience accessor.
 */
export const ERM_CANONICAL_HEADERS = ERM_HEADER_PRESET.map(h => h.name);
