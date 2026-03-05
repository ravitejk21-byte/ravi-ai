import { Prompt, Engagement } from './types';
import { v4 as uuidv4 } from 'uuid';

export const samplePrompts: Prompt[] = [
  {
    id: uuidv4(),
    name: 'ERM Risk Appetite Statement',
    description: 'Generate a comprehensive Enterprise Risk Management Risk Appetite Statement tailored to the organization.',
    template: `# Risk Appetite Statement for {{organizationName}}

## Executive Summary

{{organizationName}} recognizes that effective risk management is essential to achieving our strategic objectives. This Risk Appetite Statement defines the nature and amount of risk we are willing to accept in pursuit of our goals.

## Organizational Context

**Industry:** {{industry}}
**Strategic Objectives:** {{strategicObjectives}}
**Regulatory Environment:** {{regulatoryEnvironment}}

## Risk Appetite by Category

### Strategic Risks
- **Appetite:** {{strategicRiskAppetite}}
- **Rationale:** {{strategicRiskRationale}}

### Operational Risks
- **Appetite:** {{operationalRiskAppetite}}
- **Rationale:** {{operationalRiskRationale}}

### Financial Risks
- **Appetite:** {{financialRiskAppetite}}
- **Rationale:** {{financialRiskRationale}}

### Compliance Risks
- **Appetite:** Minimal - zero tolerance for regulatory breaches
- **Rationale:** {{complianceRiskRationale}}

## Risk Tolerance Thresholds

{{#if quantitativeThresholds}}
### Quantitative Thresholds
{{quantitativeThresholds}}
{{/if}}

{{#if qualitativeThresholds}}
### Qualitative Thresholds
{{qualitativeThresholds}}
{{/if}}

## Governance and Review

This Risk Appetite Statement is approved by the Board of Directors and will be reviewed {{reviewFrequency}}.

**Approved by:** ___________________
**Date:** {{approvalDate}}
`,
    variables: [
      { name: 'organizationName', label: 'Organization Name', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text', required: true },
      { name: 'strategicObjectives', label: 'Strategic Objectives', type: 'textarea', required: true },
      { name: 'regulatoryEnvironment', label: 'Regulatory Environment', type: 'textarea', required: true },
      { name: 'strategicRiskAppetite', label: 'Strategic Risk Appetite', type: 'select', required: true, options: ['Averse', 'Minimal', 'Cautious', 'Open', 'Aggressive'] },
      { name: 'strategicRiskRationale', label: 'Strategic Risk Rationale', type: 'textarea', required: true },
      { name: 'operationalRiskAppetite', label: 'Operational Risk Appetite', type: 'select', required: true, options: ['Averse', 'Minimal', 'Cautious', 'Open', 'Aggressive'] },
      { name: 'operationalRiskRationale', label: 'Operational Risk Rationale', type: 'textarea', required: true },
      { name: 'financialRiskAppetite', label: 'Financial Risk Appetite', type: 'select', required: true, options: ['Averse', 'Minimal', 'Cautious', 'Open', 'Aggressive'] },
      { name: 'financialRiskRationale', label: 'Financial Risk Rationale', type: 'textarea', required: true },
      { name: 'complianceRiskRationale', label: 'Compliance Risk Rationale', type: 'textarea', required: true },
      { name: 'quantitativeThresholds', label: 'Quantitative Thresholds', type: 'textarea', required: false },
      { name: 'qualitativeThresholds', label: 'Qualitative Thresholds', type: 'textarea', required: false },
      { name: 'reviewFrequency', label: 'Review Frequency', type: 'select', required: true, options: ['Annually', 'Semi-annually', 'Quarterly'] },
      { name: 'approvalDate', label: 'Approval Date', type: 'text', required: true },
    ],
    category: 'ERM',
    tags: ['risk appetite', 'ERM', 'governance', 'board'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Internal Audit Plan',
    description: 'Create a risk-based internal audit plan for the fiscal year.',
    template: `# Internal Audit Plan - {{fiscalYear}}

## Plan Overview

**Organization:** {{organizationName}}
**Plan Period:** {{fiscalYear}}
**Total Audit Days:** {{totalAuditDays}}
**Budget:** {{budget}}

## Risk Assessment Summary

Based on our risk assessment, the following areas have been identified as high-priority:

{{riskAssessmentSummary}}

## Planned Audits

### Q1 Audits
{{#each q1Audits}}
- **{{name}}** (Priority: {{priority}})
  - Objective: {{objective}}
  - Estimated Days: {{days}}
{{/each}}

### Q2 Audits
{{#each q2Audits}}
- **{{name}}** (Priority: {{priority}})
  - Objective: {{objective}}
  - Estimated Days: {{days}}
{{/each}}

### Q3 Audits
{{#each q3Audits}}
- **{{name}}** (Priority: {{priority}})
  - Objective: {{objective}}
  - Estimated Days: {{days}}
{{/each}}

### Q4 Audits
{{#each q4Audits}}
- **{{name}}** (Priority: {{priority}})
  - Objective: {{objective}}
  - Estimated Days: {{days}}
{{/each}}

## Resource Allocation

{{resourceAllocation}}

## Key Risk Areas

{{keyRiskAreas}}

## Follow-up Audits

{{followUpAudits}}

## Plan Approval

**Prepared by:** {{preparedBy}}
**Approved by:** {{approvedBy}}
**Date:** {{approvalDate}}
`,
    variables: [
      { name: 'organizationName', label: 'Organization Name', type: 'text', required: true },
      { name: 'fiscalYear', label: 'Fiscal Year', type: 'text', required: true },
      { name: 'totalAuditDays', label: 'Total Audit Days', type: 'number', required: true },
      { name: 'budget', label: 'Budget', type: 'text', required: true },
      { name: 'riskAssessmentSummary', label: 'Risk Assessment Summary', type: 'textarea', required: true },
      { name: 'q1Audits', label: 'Q1 Audits (JSON format)', type: 'textarea', required: false },
      { name: 'q2Audits', label: 'Q2 Audits (JSON format)', type: 'textarea', required: false },
      { name: 'q3Audits', label: 'Q3 Audits (JSON format)', type: 'textarea', required: false },
      { name: 'q4Audits', label: 'Q4 Audits (JSON format)', type: 'textarea', required: false },
      { name: 'resourceAllocation', label: 'Resource Allocation', type: 'textarea', required: true },
      { name: 'keyRiskAreas', label: 'Key Risk Areas', type: 'textarea', required: true },
      { name: 'followUpAudits', label: 'Follow-up Audits', type: 'textarea', required: false },
      { name: 'preparedBy', label: 'Prepared By', type: 'text', required: true },
      { name: 'approvedBy', label: 'Approved By', type: 'text', required: true },
      { name: 'approvalDate', label: 'Approval Date', type: 'text', required: true },
    ],
    category: 'Internal Audit',
    tags: ['audit plan', 'internal audit', 'risk-based'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Risk Control Matrix',
    description: 'Generate a Risk and Control Matrix (RCM) for a specific process or area.',
    template: `# Risk and Control Matrix

## Process Information

**Process Name:** {{processName}}
**Process Owner:** {{processOwner}}
**Department:** {{department}}
**Assessment Date:** {{assessmentDate}}

## Risk and Control Matrix

| Risk ID | Risk Description | Likelihood | Impact | Risk Rating | Control ID | Control Description | Control Type | Control Effectiveness | Residual Risk |
|---------|------------------|------------|--------|-------------|------------|---------------------|--------------|----------------------|---------------|
{{#each risks}}
| R{{id}} | {{description}} | {{likelihood}} | {{impact}} | {{riskRating}} | {{controlId}} | {{controlDescription}} | {{controlType}} | {{controlEffectiveness}} | {{residualRisk}} |
{{/each}}

## Risk Summary

- **High Risks:** {{highRiskCount}}
- **Medium Risks:** {{mediumRiskCount}}
- **Low Risks:** {{lowRiskCount}}

## Control Gaps

{{controlGaps}}

## Remediation Plan

{{remediationPlan}}

## Sign-offs

**Process Owner:** ___________________ Date: {{signOffDate}}
**Risk Manager:** ___________________ Date: {{signOffDate}}
**Internal Audit:** ___________________ Date: {{signOffDate}}
`,
    variables: [
      { name: 'processName', label: 'Process Name', type: 'text', required: true },
      { name: 'processOwner', label: 'Process Owner', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'assessmentDate', label: 'Assessment Date', type: 'text', required: true },
      { name: 'risks', label: 'Risks (JSON array)', type: 'textarea', required: true, description: 'Array of risk objects with id, description, likelihood, impact, riskRating, controlId, controlDescription, controlType, controlEffectiveness, residualRisk' },
      { name: 'highRiskCount', label: 'High Risk Count', type: 'number', required: true },
      { name: 'mediumRiskCount', label: 'Medium Risk Count', type: 'number', required: true },
      { name: 'lowRiskCount', label: 'Low Risk Count', type: 'number', required: true },
      { name: 'controlGaps', label: 'Control Gaps', type: 'textarea', required: false },
      { name: 'remediationPlan', label: 'Remediation Plan', type: 'textarea', required: false },
      { name: 'signOffDate', label: 'Sign-off Date', type: 'text', required: true },
    ],
    category: 'Risk Management',
    tags: ['RCM', 'risk control matrix', 'controls', 'SOX'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Governance Framework',
    description: 'Create a comprehensive Corporate Governance Framework document.',
    template: `# Corporate Governance Framework

## {{organizationName}}

**Version:** {{version}}
**Effective Date:** {{effectiveDate}}
**Last Reviewed:** {{lastReviewed}}

---

## 1. Introduction

### 1.1 Purpose
{{purpose}}

### 1.2 Scope
{{scope}}

### 1.3 Governance Principles
{{governancePrinciples}}

---

## 2. Governance Structure

### 2.1 Board of Directors
**Composition:** {{boardComposition}}
**Responsibilities:**
{{boardResponsibilities}}

### 2.2 Board Committees
{{#each boardCommittees}}
#### {{name}}
- **Chair:** {{chair}}
- **Members:** {{members}}
- **Terms of Reference:** {{termsOfReference}}
{{/each}}

### 2.3 Executive Management
{{executiveManagementStructure}}

---

## 3. Governance Policies

### 3.1 Code of Conduct
{{codeOfConductSummary}}

### 3.2 Delegation of Authority
{{delegationOfAuthority}}

### 3.3 Related Party Transactions
{{relatedPartyTransactions}}

---

## 4. Risk Governance

### 4.1 Risk Oversight Structure
{{riskOversightStructure}}

### 4.2 Risk Management Integration
{{riskManagementIntegration}}

---

## 5. Compliance and Ethics

### 5.1 Compliance Framework
{{complianceFramework}}

### 5.2 Whistleblower Program
{{whistleblowerProgram}}

---

## 6. Governance Evaluation

### 6.1 Board Evaluation
{{boardEvaluationProcess}}

### 6.2 Continuous Improvement
{{continuousImprovement}}

---

## Approval

**Approved by Board of Directors:**

**Chairman Signature:** ___________________ **Date:** {{approvalDate}}

**Company Secretary:** {{companySecretary}}
`,
    variables: [
      { name: 'organizationName', label: 'Organization Name', type: 'text', required: true },
      { name: 'version', label: 'Version', type: 'text', required: true },
      { name: 'effectiveDate', label: 'Effective Date', type: 'text', required: true },
      { name: 'lastReviewed', label: 'Last Reviewed Date', type: 'text', required: true },
      { name: 'purpose', label: 'Purpose', type: 'textarea', required: true },
      { name: 'scope', label: 'Scope', type: 'textarea', required: true },
      { name: 'governancePrinciples', label: 'Governance Principles', type: 'textarea', required: true },
      { name: 'boardComposition', label: 'Board Composition', type: 'textarea', required: true },
      { name: 'boardResponsibilities', label: 'Board Responsibilities', type: 'textarea', required: true },
      { name: 'boardCommittees', label: 'Board Committees (JSON)', type: 'textarea', required: false },
      { name: 'executiveManagementStructure', label: 'Executive Management Structure', type: 'textarea', required: true },
      { name: 'codeOfConductSummary', label: 'Code of Conduct Summary', type: 'textarea', required: true },
      { name: 'delegationOfAuthority', label: 'Delegation of Authority', type: 'textarea', required: true },
      { name: 'relatedPartyTransactions', label: 'Related Party Transactions', type: 'textarea', required: true },
      { name: 'riskOversightStructure', label: 'Risk Oversight Structure', type: 'textarea', required: true },
      { name: 'riskManagementIntegration', label: 'Risk Management Integration', type: 'textarea', required: true },
      { name: 'complianceFramework', label: 'Compliance Framework', type: 'textarea', required: true },
      { name: 'whistleblowerProgram', label: 'Whistleblower Program', type: 'textarea', required: true },
      { name: 'boardEvaluationProcess', label: 'Board Evaluation Process', type: 'textarea', required: true },
      { name: 'continuousImprovement', label: 'Continuous Improvement', type: 'textarea', required: true },
      { name: 'approvalDate', label: 'Approval Date', type: 'text', required: true },
      { name: 'companySecretary', label: 'Company Secretary', type: 'text', required: true },
    ],
    category: 'Governance',
    tags: ['governance', 'framework', 'board', 'compliance'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Board Presentation',
    description: 'Generate a board presentation for risk, audit, or governance matters.',
    template: `# Board Presentation: {{presentationTitle}}

**Date:** {{presentationDate}}
**Presenter:** {{presenterName}}
**Duration:** {{duration}}

---

## Slide 1: Executive Summary

### Key Points
{{executiveSummary}}

### Recommendations
{{recommendations}}

---

## Slide 2: Context and Background

{{contextBackground}}

---

## Slide 3: Current State Assessment

{{currentStateAssessment}}

---

## Slide 4: Key Findings/Issues

{{#each keyFindings}}
### {{title}}
- **Issue:** {{issue}}
- **Impact:** {{impact}}
- **Recommendation:** {{recommendation}}
{{/each}}

---

## Slide 5: Risk Analysis

{{riskAnalysis}}

---

## Slide 6: Options and Alternatives

{{#each options}}
### Option {{number}}: {{title}}
- **Description:** {{description}}
- **Pros:** {{pros}}
- **Cons:** {{cons}}
- **Cost:** {{cost}}
{{/each}}

---

## Slide 7: Recommended Approach

{{recommendedApproach}}

---

## Slide 8: Implementation Plan

| Phase | Activities | Timeline | Owner | Resources |
|-------|------------|----------|-------|-----------|
{{#each implementationPhases}}
| {{phase}} | {{activities}} | {{timeline}} | {{owner}} | {{resources}} |
{{/each}}

---

## Slide 9: Resource Requirements

{{resourceRequirements}}

---

## Slide 10: Next Steps

{{nextSteps}}

---

## Appendix

{{appendixContent}}
`,
    variables: [
      { name: 'presentationTitle', label: 'Presentation Title', type: 'text', required: true },
      { name: 'presentationDate', label: 'Presentation Date', type: 'text', required: true },
      { name: 'presenterName', label: 'Presenter Name', type: 'text', required: true },
      { name: 'duration', label: 'Duration', type: 'text', required: true },
      { name: 'executiveSummary', label: 'Executive Summary', type: 'textarea', required: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'contextBackground', label: 'Context and Background', type: 'textarea', required: true },
      { name: 'currentStateAssessment', label: 'Current State Assessment', type: 'textarea', required: true },
      { name: 'keyFindings', label: 'Key Findings (JSON array)', type: 'textarea', required: true },
      { name: 'riskAnalysis', label: 'Risk Analysis', type: 'textarea', required: true },
      { name: 'options', label: 'Options (JSON array)', type: 'textarea', required: false },
      { name: 'recommendedApproach', label: 'Recommended Approach', type: 'textarea', required: true },
      { name: 'implementationPhases', label: 'Implementation Phases (JSON array)', type: 'textarea', required: true },
      { name: 'resourceRequirements', label: 'Resource Requirements', type: 'textarea', required: true },
      { name: 'nextSteps', label: 'Next Steps', type: 'textarea', required: true },
      { name: 'appendixContent', label: 'Appendix Content', type: 'textarea', required: false },
    ],
    category: 'Board',
    tags: ['board', 'presentation', 'executive', 'governance'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const sampleEngagements: Engagement[] = [
  {
    id: uuidv4(),
    name: 'Annual Risk Assessment 2024',
    client: 'ABC Corporation',
    status: 'active',
    startDate: new Date('2024-01-15'),
    description: 'Comprehensive enterprise risk assessment including risk identification, analysis, and mitigation planning.',
    deliverables: [],
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'SOX Compliance Review',
    client: 'XYZ Financial',
    status: 'active',
    startDate: new Date('2024-02-01'),
    description: 'Sarbanes-Oxley compliance review and control testing for financial reporting.',
    deliverables: [],
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'IT General Controls Audit',
    client: 'Tech Solutions Inc',
    status: 'completed',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-11-30'),
    description: 'Assessment of IT general controls including access management, change management, and backup procedures.',
    deliverables: [],
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
