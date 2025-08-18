import React, { useRef, useState } from 'react';
import { Download, Share2, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ImageResultProps {
  originalImage: string;
  generatedImage: string;
  onReset: () => void;
}

export const ImageResult: React.FC<ImageResultProps> = ({ 
  originalImage, 
  generatedImage, 
  onReset 
}) => {
  const portraitRef = useRef<HTMLDivElement>(null);
  const landscapeRef = useRef<HTMLDivElement>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'parkified-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    setShowShareOptions(true);
  };

  const handleFormatShare = async (format: 'portrait' | 'landscape') => {
    setShowShareOptions(false);
    const currentRef = format === 'portrait' ? portraitRef.current : landscapeRef.current;
    if (!currentRef) return;

    try {
      // Capture the screenshot of the comparison section
      const canvas = await html2canvas(currentRef, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true
      });
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `parkify-transformation-${format}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              title: 'My South Park Style Image from Parkify!',
              text: 'Check out my South Park transformation! #parkify',
              files: [file]
            });
          } catch (error) {
            console.log('Share failed:', error);
            fallbackShare(canvas, format);
          }
        } else {
          fallbackShare(canvas, format);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot failed:', error);
      // Fallback to original share behavior
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My South Park Style Image from Parkify!',
            text: 'Check out my South Park transformation! #parkify',
            url: window.location.href
          });
        } catch (shareError) {
          console.log('Share failed:', shareError);
        }
      } else {
        navigator.clipboard.writeText(window.location.href + ' #parkify');
        alert('Link copied to clipboard!');
      }
    }
  };

  const fallbackShare = (canvas: HTMLCanvasElement, format: 'portrait' | 'landscape') => {
    // Download the image as fallback
    const link = document.createElement('a');
    link.download = `parkify-transformation-${format}.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`${format === 'portrait' ? 'Mobile' : 'Desktop'} screenshot saved! Share it with #parkify`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-southpark font-bold text-gray-800 mb-2">
          🎉 Your South Park Transformation is Complete!
        </h2>
        <p className="text-gray-600">
          Oh my God! They South Park-ified your photo!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-southpark font-bold text-gray-800 text-center">Original</h3>
          <div className="border-4 border-gray-300 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={originalImage} 
              alt="Original" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-southpark font-bold text-gray-800 text-center">South Park Style</h3>
          <div className="border-4 border-orange-500 rounded-2xl overflow-hidden shadow-xl">
            <img 
              src={generatedImage} 
              alt="South Park Style" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareOptions(false)}>
          <div className="bg-white rounded-3xl border-4 border-gray-800 p-8 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-southpark font-bold text-gray-800 text-center mb-6">Choose Share Format</h3>
            
            <div className="space-y-4">
              <button
                onClick={() => handleFormatShare('portrait')}
                className="w-full flex items-center space-x-4 p-4 rounded-2xl border-4 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-all"
              >
                <Smartphone className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <h4 className="font-southpark font-bold text-blue-800">Mobile / Stories</h4>
                  <p className="text-sm text-blue-600">Perfect for Instagram Stories, TikTok</p>
                </div>
              </button>
              
              <button
                onClick={() => handleFormatShare('landscape')}
                className="w-full flex items-center space-x-4 p-4 rounded-2xl border-4 border-green-500 bg-green-50 hover:bg-green-100 transition-all"
              >
                <Monitor className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <h4 className="font-southpark font-bold text-green-800">Twitter / Desktop</h4>
                  <p className="text-sm text-green-600">Optimized for Twitter, Facebook</p>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowShareOptions(false)}
              className="w-full mt-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden Portrait Screenshot Area */}
      <div ref={portraitRef} className="bg-white p-6 space-y-6" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '400px' }}>
        {/* Top branding */}
        <div className="text-center">
          <p className="text-3xl font-southpark font-bold text-orange-600 mb-2">
            #parkify
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl font-southpark font-bold text-gray-800 text-center">Original</h3>
            <div className="border-4 border-gray-300 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-southpark font-bold text-gray-800 text-center">South Park Style</h3>
            <div className="border-4 border-orange-500 rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={generatedImage} 
                alt="South Park Style" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Bottom website URL */}
        <div className="text-center">
          <p className="text-lg font-southpark font-semibold text-gray-600">
            www.parkify.me
          </p>
        </div>
      </div>

      {/* Hidden Landscape Screenshot Area */}
      <div ref={landscapeRef} className="bg-white p-8 space-y-6" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
        {/* Top branding */}
        <div className="text-center">
          <p className="text-4xl font-southpark font-bold text-orange-600 mb-2">
            #parkify
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-southpark font-bold text-gray-800 text-center">Original</h3>
            <div className="border-4 border-gray-300 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-southpark font-bold text-gray-800 text-center">South Park Style</h3>
            <div className="border-4 border-orange-500 rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={generatedImage} 
                alt="South Park Style" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Bottom website URL */}
        <div className="text-center">
          <p className="text-2xl font-southpark font-semibold text-gray-600">
            www.parkify.me
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full border-4 border-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download</span>
        </button>
        
        <button
          onClick={handleShare}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full border-4 border-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
        
        <button
          onClick={onReset}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full border-4 border-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Try Another</span>
        </button>
      </div>
    </div>
  );
};