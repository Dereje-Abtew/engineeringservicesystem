// frontend/src/types/estimation.ts

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  documentType?: string;
  uploadedById?: string;
}

export interface EstimationRequest {
  id: number;
  applicantName: string;
  ownerName: string;
  lhuNo: string;
  city: string;
  subCity: string;
  kebele: string;
  latitude: number;
  longitude: number;
  plotArea: number;
  buildingType: string;
  purpose: string;
  type: string;
  status: number;
  createdAt: string;
  branchUserId?: string;
  branchUserName?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  engineerAssignmentDate?: string;
  attachments: Attachment[];
  reportId?: number;
  filteredEstimationAttachments?: Attachment[];
  filteredAttachmentIds?: number[];
  selectableAttachmentIds?: number[];
  checkerActionDate?: string;
  checkerActionDescription?: string;
  checkerRejectionReason?: string;
  managerActionDate?: string;
  managerActionDescription?: string;
  managerRejectionReason?: string;
  lastRejectionReason?: string;
  lastRejectionBy?: string;
  lastRejectionDate?: string;
}

export interface Engineer {
  id: string;
  name: string;
}

export interface AttachmentUpload {
  fileName: string;
  filePath: string;
  documentType: string;
}

export interface CreateEstimationRequest {
  applicantName: string;
  ownerName: string;
  lhuNo: string;
  city: string;
  subCity: string;
  kebele: string;
  latitude: number;
  longitude: number;
  plotArea: number;
  buildingType: number;
  purpose: number;
  type: number;
  attachments: AttachmentUpload[];
}