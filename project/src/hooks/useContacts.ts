import { useState, useEffect } from 'react';
import { contactsService } from '../services/supabaseService';
import { Contact } from '../lib/supabase';
import MessageQueue from '../services/MessageQueue';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageQueue] = useState(() => new MessageQueue());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await contactsService.getAll();
        setContacts(data);
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        // Fallback para localStorage se Supabase não disponível
        const savedContacts = localStorage.getItem('crm-contacts');
        if (savedContacts) {
          setContacts(JSON.parse(savedContacts));
        } else {
          setContacts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Backup no localStorage
  const saveToLocalStorage = (newContacts: Contact[]) => {
    localStorage.setItem('crm-contacts', JSON.stringify(newContacts));
  };

  const addContact = async (contactData: any) => {
    try {
      // Check if contact with this phone already exists
      const existingContact = await contactsService.getByPhone(contactData.phone);
      
      if (existingContact) {
        // Update existing contact instead of creating new one
        const updatedContact = await updateContact(existingContact.id, {
          name: contactData.name,
          email: contactData.email || null,
          status: contactData.status || 'new',
          tags: contactData.tags || [],
          notes: contactData.notes || null,
          property_interest: contactData.propertyInterest || null,
          budget: contactData.budget || null
        });
        return updatedContact;
      }
      
      // Create new contact if phone doesn't exist
      const newContact = await contactsService.create({
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email || null,
        status: contactData.status || 'new',
        tags: contactData.tags || [],
        notes: contactData.notes || null,
        property_interest: contactData.propertyInterest || null,
        budget: contactData.budget || null
      });
      
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
      return newContact;
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      
      // Fallback para localStorage
      const newContact: Contact = {
        id: Date.now().toString(),
        user_id: 'local',
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email || null,
        status: contactData.status || 'new',
        tags: contactData.tags || [],
        notes: contactData.notes || null,
        property_interest: contactData.propertyInterest || null,
        budget: contactData.budget || null,
        created_at: new Date().toISOString()
      };
      
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
      return newContact;
    }
  };

  const updateContact = async (id: string, updates: any) => {
    try {
      await contactsService.update(id, {
        name: updates.name,
        phone: updates.phone,
        email: updates.email,
        status: updates.status,
        tags: updates.tags,
        notes: updates.notes,
        property_interest: updates.propertyInterest,
        budget: updates.budget
      });
      
      const updatedContacts = contacts.map(contact =>
        contact.id === id ? { ...contact, ...updates } : contact
      );
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      
      // Fallback para localStorage
      const updatedContacts = contacts.map(contact =>
        contact.id === id ? { ...contact, ...updates } : contact
      );
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactsService.delete(id);
      
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
    } catch (error) {
      console.error('Erro ao deletar contato:', error);
      
      // Fallback para localStorage
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      setContacts(updatedContacts);
      saveToLocalStorage(updatedContacts);
    }
  };

  const importFromCSV = (csvData: string) => {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const newContacts: Contact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const contactData = {
        name: values[0] || '',
        phone: values[1] || '',
        email: values[2] || null,
        status: 'new',
        tags: values[3] ? values[3].split(';') : [],
        notes: values[4] || null,
        propertyInterest: values[5] || null,
        budget: values[6] ? parseFloat(values[6]) : null
      };
      
      if (contactData.name && contactData.phone) {
        addContact(contactData);
      }
    }
    
    return contacts.length;
  };

  const sendMessage = async (
    contact: any, 
    message: string, 
    media?: { file: File; type: 'image' | 'video'; caption: string }
  ): Promise<void> => {
    setSending(true);
    
    try {
      if (media) {
        // Lógica para envio de mídia
        console.log('Enviando mídia para:', contact.name);
        // Implementar envio de mídia aqui
      } else {
        messageQueue.addToQueue([contact], message);
      }
    } finally {
      setSending(false);
    }
  };

  const sendBulkMessages = async (contacts: any[], message: string) => {
    setSending(true);
    messageQueue.addToQueue(contacts, message);
    setSending(false);
  };

  return {
    contacts,
    loading,
    sending,
    messageQueue,
    addContact,
    updateContact,
    deleteContact,
    importFromCSV,
    sendMessage,
    sendBulkMessages,
  };
};