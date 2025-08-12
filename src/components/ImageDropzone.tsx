import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  }, [onImageSelect, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-4 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer
          ${disabled 
            ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
            : isDragOver
              ? 'border-orange-500 bg-orange-50 transform scale-105'
              : 'border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isDragOver ? (
            <Upload className="w-16 h-16 text-orange-500 animate-bounce" />
          ) : (
            <ImageIcon className="w-16 h-16 text-blue-500" />
          )}
          
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {disabled ? 'Processing...' : 'Drop your photo here!'}
            </h3>
            <p className="text-gray-600">
              {disabled 
                ? 'Please wait while we South Park-ify your image'
                : 'Or click to browse and select an image file'
              }
            </p>
          </div>
          
          {!disabled && (
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full border-4 border-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
              Choose File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};