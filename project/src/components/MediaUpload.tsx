import React, { useState, useRef } from 'react';
import { Upload, Image, Video, X, Eye } from 'lucide-react';

interface MediaUploadProps {
  onMediaSelect: (file: File, type: 'image' | 'video') => void;
  onRemoveMedia: () => void;
  selectedMedia?: { file: File; type: 'image' | 'video'; preview: string } | null;
  caption: string;
  onCaptionChange: (caption: string) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelect,
  onRemoveMedia,
  selectedMedia,
  caption,
  onCaptionChange,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Por favor, selecione apenas arquivos de imagem ou vídeo.');
      return;
    }

    // Verificar tamanho do arquivo (máximo 16MB para WhatsApp)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. O tamanho máximo é 16MB.');
      return;
    }

    const type = isImage ? 'image' : 'video';
    onMediaSelect(file, type);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!selectedMedia ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <div className="space-y-3">
            <div className="flex justify-center space-x-4">
              <Image className="h-8 w-8 text-gray-400" />
              <Video className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Upload className="h-4 w-4" />
                <span>Selecionar Mídia</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Imagens (JPG, PNG, GIF) ou Vídeos (MP4, MOV, AVI)
            </p>
            <p className="text-xs text-gray-500">
              Tamanho máximo: 16MB
            </p>
          </div>
        </div>
      ) : (
        /* Selected Media Preview */
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {selectedMedia.type === 'image' ? (
                <Image className="h-5 w-5 text-blue-600" />
              ) : (
                <Video className="h-5 w-5 text-purple-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedMedia.file.name}
                </p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(selectedMedia.file.size)} • {selectedMedia.type}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Visualizar"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRemoveMedia}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Legenda (opcional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Adicione uma legenda para sua mídia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* Change Media Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            Alterar mídia
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.preview}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <video
                src={selectedMedia.preview}
                controls
                className="max-w-full max-h-[90vh]"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;