import React, { useState, useEffect } from 'react';
import { Contact, MessageTemplate } from '../types';
import { Send, Eye, X, User, Type, Image } from 'lucide-react';
import { messageTemplates } from '../data/mockData';
import MediaUpload from './MediaUpload';

interface MessageComposerProps {
  isOpen: boolean;
  contact?: Contact;
  onSend: (contact: Contact, message: string, media?: { file: File; type: 'image' | 'video'; caption: string }) => void;
  onClose: () => void;
  sending: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  isOpen,
  contact,
  onSend,
  onClose,
  sending,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [messageType, setMessageType] = useState<'text' | 'media'>('text');
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; type: 'image' | 'video'; preview: string } | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');

  useEffect(() => {
    if (contact) {
      setVariables({
        nome: contact.name,
        corretor: 'João Corretor',
        imobiliaria: 'Imobiliária Prime',
        tipo_imovel: contact.propertyInterest || 'imóvel',
      });
    }
  }, [contact]);

  const processMessage = (template: string, vars: Record<string, string>) => {
    let processed = template;
    Object.entries(vars).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return processed;
  };

  const getCurrentMessage = () => {
    if (selectedTemplate) {
      return processMessage(selectedTemplate.content, variables);
    }
    return customMessage;
  };

  const handleSend = () => {
    if (!contact) return;
    
    if (messageType === 'media') {
      if (!selectedMedia) {
        alert('Selecione uma mídia para enviar');
        return;
      }
      onSend(contact, mediaCaption, {
        file: selectedMedia.file,
        type: selectedMedia.type,
        caption: mediaCaption
      });
    } else {
      const message = getCurrentMessage();
      if (message.trim()) {
        onSend(contact, message);
      }
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage('');
    
    // Inicializar variáveis do template
    const newVariables = { ...variables };
    template.variables.forEach(variable => {
      if (!newVariables[variable]) {
        newVariables[variable] = '';
      }
    });
    setVariables(newVariables);
  };

  const handleMediaSelect = (file: File, type: 'image' | 'video') => {
    const preview = URL.createObjectURL(file);
    setSelectedMedia({ file, type, preview });
  };

  const handleRemoveMedia = () => {
    if (selectedMedia) {
      URL.revokeObjectURL(selectedMedia.preview);
    }
    setSelectedMedia(null);
    setMediaCaption('');
  };

  // Cleanup URL objects when component unmounts or media changes
  useEffect(() => {
    return () => {
      if (selectedMedia) {
        URL.revokeObjectURL(selectedMedia.preview);
      }
    };
  }, [selectedMedia]);

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enviar Mensagem</h2>
              <p className="text-sm text-gray-600">{contact.name} - {contact.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Message Type Selector */}
          <div className="w-48 border-r p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tipo de Mensagem</h3>
            <div className="space-y-2">
              <button
                onClick={() => setMessageType('text')}
                className={`w-full flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  messageType === 'text'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Type className="h-4 w-4" />
                <span className="text-sm">Texto</span>
              </button>
              <button
                onClick={() => setMessageType('media')}
                className={`w-full flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  messageType === 'media'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Image className="h-4 w-4" />
                <span className="text-sm">Mídia</span>
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className={`${messageType === 'text' ? 'w-1/3' : 'w-1/4'} border-r p-4 overflow-y-auto`}>
            <h3 className="font-semibold text-gray-900 mb-4">Templates</h3>
            {messageType === 'text' && (
              <div className="space-y-2">
                {messageTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {template.category}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setCustomMessage('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    !selectedTemplate
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">Mensagem Personalizada</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Escreva sua própria mensagem
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messageType === 'media' ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Enviar Mídia
                </h3>
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  onRemoveMedia={handleRemoveMedia}
                  selectedMedia={selectedMedia}
                  caption={mediaCaption}
                  onCaptionChange={setMediaCaption}
                />
              </div>
            ) : selectedTemplate ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  {selectedTemplate.name}
                </h3>
                
                {/* Variables */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-700">Variáveis:</h4>
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {variable}
                      </label>
                      <input
                        type="text"
                        value={variables[variable] || ''}
                        onChange={(e) =>
                          setVariables({ ...variables, [variable]: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Digite o valor para {${variable}}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Preview:</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {processMessage(selectedTemplate.content, variables)}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Mensagem Personalizada
                </h3>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Digite sua mensagem personalizada..."
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className={`${messageType === 'text' ? 'w-1/3' : 'w-1/4'} border-l p-4 bg-gray-50`}>
              <h3 className="font-semibold text-gray-900 mb-4">Preview Final</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600 mb-2">Para: {contact.name}</div>
                {messageType === 'media' ? (
                  <div>
                    {selectedMedia && (
                      <div className="mb-2">
                        {selectedMedia.type === 'image' ? (
                          <img
                            src={selectedMedia.preview}
                            alt="Preview"
                            className="max-w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={selectedMedia.preview}
                            className="max-w-full h-32 object-cover rounded"
                            muted
                          />
                        )}
                      </div>
                    )}
                    {mediaCaption && (
                      <div className="text-sm whitespace-pre-wrap">
                        {mediaCaption}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {getCurrentMessage()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={sending || (messageType === 'text' ? !getCurrentMessage().trim() : !selectedMedia)}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>
                {sending ? 'Enviando...' : messageType === 'media' ? 'Enviar Mídia' : 'Enviar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;