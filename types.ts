
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'food' | 'daily' | 'other';
  expiryDate?: string;
  addedDate: string;
  description: string;
  nutritionInfo?: string;
  quantity: number;
}

export interface User {
  id: string;
  identifier: string; // email or phone
  name: string;
  pin: string; // Simulated secure PIN
}
