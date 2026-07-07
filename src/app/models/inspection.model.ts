export interface Inspection {
  id: string;
  equipmentId: string;
  sysId: string;
  equipmentName: string;
  dueDate: string;
  resultStatus: 'Passed' | 'Failed' | 'Pending';
  syncStatus: 'Pending' | 'Synced' | 'Failed';
  updatedAt: string;
  technicalNotes?: string;
  opHours?: number;
  coreTemp?: number;
  voltStability?: number;
  imageB64?: string;
}
