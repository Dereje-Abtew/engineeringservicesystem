# Engineering Service System

## USER ACCEPTANCE TESTING (UAT) SIGN-OFF

**Module: Property Estimation Request Management**

---

| Item | Details |
|------|---------|
| **Document Title** | User Acceptance Testing (UAT) Sign-Off |
| **System** | Engineering Service System |
| **Module** | Property Estimation Request Management |
| **Testing Environment** | UAT |
| **Business Owner / Receiving Unit** | Engineering & Valuation Unit |
| **Document Date** | June 27, 2026 |

---

## 1. Purpose

This document records the formal User Acceptance Testing sign-off for the Property Estimation Request Management module of the Engineering Service System. It confirms that the solution has been reviewed by the designated business stakeholders and is ready for operational handover, subject to the decision and approval of the Engineering & Valuation Unit.

---

## 2. Objective

The objective of this sign-off is to confirm that the Engineering Service System supports the multi-step estimation workflow (Maker → Checker → Manager → Engineering Officer), captures and validates property and applicant information, manages document attachments throughout the workflow, enforces role-based access control with granular permissions, provides visibility of estimation reports and filtered documents to authorized roles, and is ready for controlled business use in line with the agreed UAT scope.

---

## 3. Scope of UAT

### 3.1 In-Scope Functional Areas

| No. | Functional Area | UAT Coverage |
|-----|----------------|--------------|
| 1 | User Authentication & Authorization | Login with JWT, role-based access, permission enforcement |
| 2 | Estimation Request Creation (Maker) | Capture of applicant, property, and location information |
| 3 | Document Upload (Maker) | Upload of required supporting documents at request creation |
| 4 | Checker Review Workflow | Checker approval and rejection of submitted requests |
| 5 | Manager Review Workflow | Manager approval, rejection, and engineering officer assignment |
| 6 | Engineering Officer Assignment | Assignment and unassignment of engineering officers to requests |
| 7 | Engineer Estimation Submission | Upload of Estimation Excel, Relevant Photo, and Estimation Report |
| 8 | Final Estimation Upload (Manager/Checker) | Upload of Final Estimation Excel after engineer submission |
| 9 | Estimation Report Visibility | Automatic display of Estimation Report to Manager and Checker upon engineer submission |
| 10 | Request Edit & Resend Workflow | Maker ability to edit and resubmit rejected requests |
| 11 | Organizational Structure Management | Management of Departments and Branches |
| 12 | User & Role Management | User creation, role assignment, and permission management |
| 13 | Dashboard & Analytics | Summary statistics, status distribution, branch performance, monthly trend |
| 14 | Notification System | In-system notifications for workflow events |
| 15 | Ethiopian Location Support | Region, city, sub-city, and kebele selection for property location |

---

## 4. UAT Summary

Based on completed UAT activities, the Engineering Service System has been reviewed against the agreed business and operational workflow. The current version is considered functionally aligned with the agreed property estimation workflow, suitable for operational use in UAT, and ready for business sign-off and handover decision by the Engineering & Valuation Unit.

---

## 5. High-Level Functional Coverage Confirmed

| No. | Feature / Capability | Business Validation Confirmed | Pass | Fail | Remarks |
|-----|---------------------|-------------------------------|------|------|---------|
| 1 | **User Login & Session Management** | Users can log in with valid credentials and receive a JWT token with role-based permissions. Session persists across page navigation. | ☐ | ☐ | |
| 2 | **Role-Based Access Control** | Each role (Maker, Checker, Manager, EngineeringOfficer, Admin) sees only the actions and data permitted by their assigned permissions. | ☐ | ☐ | |
| 3 | **Estimation Request Creation** | Maker users can create estimation requests by entering applicant name, owner name, LHC number, location (city, sub-city, kebele), plot area, building type, purpose, and estimation type. | ☐ | ☐ | |
| 4 | **Supporting Document Upload at Creation** | Maker users can upload required supporting documents (e.g., Construction Permit, LHC, Approved Plan) when submitting a new request. | ☐ | ☐ | |
| 5 | **Project Finance Request Handling** | Requests with Purpose = Project Finance capture additional fields (Project Finance Document Type, Bill of Quantity) correctly. | ☐ | ☐ | |
| 6 | **Maker Request Visibility** | Maker users can view only their own submitted requests. | ☐ | ☐ | |
| 7 | **Checker Branch-Level Visibility** | Checker users can view all requests submitted from their assigned branch. | ☐ | ☐ | |
| 8 | **Checker Approval Workflow** | Checker can approve a Pending request with an approval date and description, advancing the status to Checker Approved. | ☐ | ☐ | |
| 9 | **Checker Rejection Workflow** | Checker can reject a Pending request with a rejection reason, setting the status to Rejected and notifying the Maker. | ☐ | ☐ | |
| 10 | **Manager All-Request Visibility** | Manager users can view all requests across all branches. | ☐ | ☐ | |
| 11 | **Manager Approval Workflow** | Manager can approve a Checker Approved request with an approval date and description, advancing the status to Manager Approved. | ☐ | ☐ | |
| 12 | **Manager Rejection Workflow** | Manager can reject a Checker Approved request with a rejection reason, setting the status to Rejected and notifying the Maker. | ☐ | ☐ | |
| 13 | **Engineering Officer Assignment** | Manager can assign an Engineering Officer to a Manager Approved request. The system displays current officer workload and provides smart assignment recommendations based on sub-city and kebele match. | ☐ | ☐ | |
| 14 | **Engineering Officer Unassignment** | Manager can unassign an Engineering Officer from a request, returning the status to Manager Approved. | ☐ | ☐ | |
| 15 | **Engineer Assigned Request Visibility** | Engineering Officer can view only the requests assigned to them. | ☐ | ☐ | |
| 16 | **Engineer Estimation Submission (Phase 1)** | Engineering Officer can submit Estimation Excel and Relevant Photo to complete the initial estimation. Status advances to Estimated. | ☐ | ☐ | |
| 17 | **Engineer Rejection of Assignment** | Engineering Officer can reject an assigned request with a reason, setting the status to Rejected. | ☐ | ☐ | |
| 18 | **Final Estimation Upload** | Manager or Checker can upload the Final Estimation Excel file after reviewing the engineer's submitted documents. | ☐ | ☐ | |
| 19 | **Estimation Report Submission (Phase 2)** | After Final Estimation is uploaded, Engineering Officer can submit the Estimation Report. The "Send Estimation Report" action becomes available in the request actions menu. | ☐ | ☐ | |
| 20 | **Automatic Estimation Report Visibility** | Upon Engineer submitting the Estimation Report, it is automatically displayed to both Manager and Checker under the "Estimation Report" section — without any manual send action required. | ☐ | ☐ | |
| 21 | **Estimation Report View & Download** | Manager and Checker can view and download the Estimation Report directly from the Request Details dialog. | ☐ | ☐ | |
| 22 | **Maker Edit of Pending Request** | Maker can edit a request while it is in Pending status (before Checker acts), without changing the workflow status. | ☐ | ☐ | |
| 23 | **Maker Resend of Rejected Request** | Maker can edit and resubmit a Rejected request. The status resets to Pending, the workflow restarts at the Checker step, and the previous rejection reason is preserved in the audit trail. | ☐ | ☐ | |
| 24 | **Workflow Audit Trail** | Checker action date/description, Manager action date/description, Engineer action date, and rejection reasons are recorded and visible in the Request Details dialog. | ☐ | ☐ | |
| 25 | **Department Management** | Admin can create, edit, and deactivate departments. | ☐ | ☐ | |
| 26 | **Branch Management** | Admin can create, edit, and deactivate branches. Branches are linked to departments and branch managers. | ☐ | ☐ | |
| 27 | **User Management** | Admin can create users, assign roles, reset passwords, and deactivate users. | ☐ | ☐ | |
| 28 | **Role & Permission Management** | Admin can create roles and assign granular permissions. Permission changes take effect on the next login. | ☐ | ☐ | |
| 29 | **Dashboard Summary Statistics** | Dashboard displays total requests, pending count, estimated count, and other key metrics relevant to the logged-in user's role. | ☐ | ☐ | |
| 30 | **Analytics — Status Distribution** | Reports page displays the distribution of requests by status. | ☐ | ☐ | |
| 31 | **Analytics — Branch Performance** | Reports page displays performance comparison across branches. | ☐ | ☐ | |
| 32 | **Analytics — Monthly Trend** | Reports page displays monthly request volume trend. | ☐ | ☐ | |
| 33 | **In-System Notifications** | Users receive in-system notifications for relevant workflow events (new request, approval, rejection, assignment, estimation report submission). | ☐ | ☐ | |
| 34 | **Session Expiry Handling** | Expired or invalid JWT tokens result in automatic logout with an appropriate message. | ☐ | ☐ | |
| 35 | **Ethiopian Location Data** | City, sub-city, and kebele dropdowns are populated with correct Ethiopian location data. Historical locations from past requests are also surfaced for reuse. | ☐ | ☐ | |

---

## 6. Roles & Permissions Reference

The following roles are seeded by default in the system:

| Role | Key Permissions |
|------|----------------|
| **Admin** | All permissions — full system access |
| **Maker** | Create requests, view own requests |
| **Checker** | View branch requests, approve/reject, upload Final Estimation, view Estimation Report |
| **Manager** | View all requests, approve/reject, assign engineers, upload Final Estimation, view Estimation Report |
| **EngineeringOfficer** | View assigned requests, edit, submit estimation, send estimation report |

---

## 7. Request Lifecycle Status Reference

| Status | Value | Description |
|--------|-------|-------------|
| Pending | 0 | Submitted by Maker, awaiting Checker review |
| Checker Approved | 1 | Approved by Checker, awaiting Manager review |
| Manager Approved | 2 | Approved by Manager, ready for engineer assignment |
| Assigned to Engineer | 3 | Engineering Officer assigned |
| Estimated | 4 | Engineer completed estimation submission |
| Rejected | 5 | Rejected at any stage (Checker, Manager, or Engineer) |

---

## 8. Out-of-Scope Items

The following items are outside the scope of this UAT:

- Integration with external banking core systems
- SMS or email notification delivery
- Mobile application testing
- Performance and load testing
- Penetration and security testing
- Data migration from legacy systems

---

## 9. Business Readiness Statement

The Engineering Service System property estimation module is hereby presented for sign-off to the Engineering & Valuation Unit as the receiving business owner. By signing this document, the Engineering & Valuation Unit confirms that:

- The estimation workflow (Maker → Checker → Manager → Engineer → Estimation Report) has been reviewed in the UAT environment
- The delivered scope is acceptable for business handover
- Role-based access controls and document visibility rules are operating as expected
- The module is ready to proceed to the next release or deployment stage, subject to internal approval processes

---

## 10. Sign-Off Authority

| Role / Responsibility | Name | Signature | Date |
|-----------------------|------|-----------|------|
| Engineering Unit — Tested By | __________________________ | __________________________ | __________ |
| Engineering Unit Manager — Approved By | __________________________ | __________________________ | __________ |
| IT / Technical Lead — System Owner | __________________________ | __________________________ | __________ |
| Business Owner / KYC / Compliance | __________________________ | __________________________ | __________ |

---

## 11. Final Statement

This document serves as the formal UAT sign-off record for the Property Estimation Request Management module of the Engineering Service System and is intended to support business handover, audit reference, and release governance approval.

---

*Engineering Service System | UAT Sign-Off | June 27, 2026*
