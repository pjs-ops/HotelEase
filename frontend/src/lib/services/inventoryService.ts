import api from '../api';

export interface InventoryItem {
  _id: string;
  name: string;
  stock: number;
  status: 'Sufficient' | 'Low' | 'Critical';
  lowThreshold: number;
  criticalThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemInput {
  name: string;
  stock?: number;
  lowThreshold?: number;
  criticalThreshold?: number;
}

const inventoryService = {
  getAll: async (): Promise<InventoryItem[]> => {
    const res = await api.get('/inventory');
    return res.data;
  },
  add: async (item: InventoryItemInput): Promise<InventoryItem> => {
    const res = await api.post('/inventory', item);
    return res.data;
  },
  update: async (id: string, updates: Partial<InventoryItemInput> & { stock?: number }): Promise<InventoryItem> => {
    const res = await api.put(`/inventory/${id}`, updates);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },
};

export default inventoryService; 