export interface Inspection {
  id: string;
  equipmentName: string;
  dueDate: string;
  resultStatus: 'Passed' | 'Failed' | 'Pending';
  syncStatus: 'Pending' | 'Synced' | 'Failed';
  updatedAt: string;
}
