import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProcessingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-6 p-12">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-pulse" />
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-southpark font-bold text-gray-800 mb-2">
          South Park-ifying Your Image!
        </h3>
        <p className="text-gray-600">
          Kenny's working on it... (hopefully he won't die this time)
        </p>
      </div>
      
      <div className="w-64 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-orange-500 animate-pulse" />
      </div>
    </div>
  );
};