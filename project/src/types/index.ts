export interface Contact {
  id: string;
  name: string;
  phone: string;
  status: ContactStatus;
  tags: string[];
  notes: string;
  createdAt: string;
  lastContact?: string;
  propertyInterest?: string;
  budget?: number;
}

export type ContactStatus = 'new' | 'contacted' | 'negotiating' | 'closed';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'greeting' | 'property' | 'follow-up' | 'closing';
}

export interface Message {
  id: string;
  contactId: string;
  content: string;
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  mediaCaption?: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}