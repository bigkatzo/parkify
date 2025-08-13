import React, { useState } from 'react';
import { ImageDropzone } from './components/ImageDropzone';
import { ProcessingSpinner } from './components/ProcessingSpinner';
import { ImageResult } from './components/ImageResult';
import { generateSouthParkImage } from './services/openai';

type AppState = 'upload' | 'processing' | 'result' | 'error';

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleImageSelect = async (file: File) => {
    setState('processing');
    
    // Create URL for original image
    const originalUrl = URL.createObjectURL(file);
    setOriginalImageUrl(originalUrl);

    try {
      const result = await generateSouthParkImage(file);
      
      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setState('result');
      } else {
        setError(result.error || 'Failed to generate image');
        setState('error');
      }
    } catch {
      setError('An unexpected error occurred');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('upload');
    setOriginalImageUrl('');
    setGeneratedImageUrl('');
    setError('');
  };

  const handleCopyCA = async () => {
    try {
      await navigator.clipboard.writeText('BxL2Z6M96m5YiJRjTAbphHjE1Ldt1Eg8Vd4vNVBdpump');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'upload':
        return <ImageDropzone onImageSelect={handleImageSelect} />;
      case 'processing':
        return <ProcessingSpinner />;
      case 'result':
        return (
          <ImageResult
            originalImage={originalImageUrl}
            generatedImage={generatedImageUrl}
            onReset={handleReset}
          />
        );
      case 'error':
        return (
          <div className="text-center p-8">
            <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-southpark font-bold text-red-800 mb-4">
                Oh No! Something Went Wrong!
              </h3>
              <p className="text-red-700 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full border-4 border-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-green-300">
      {/* Header */}
      <header className="bg-orange-500 border-b-8 border-orange-600 shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-5xl font-southpark font-bold text-white mb-2 drop-shadow-lg">
              🏔️ PARKIFY 🏔️
            </h1>
            <p className="text-xl text-orange-100 font-southpark font-semibold">
              Transform Your Photos into South Park Style!
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border-8 border-gray-800 shadow-2xl p-8 md:p-12">
          {renderContent()}
        </div>
      </main>

      {/* Coming Soon Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border-8 border-gray-800 shadow-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-southpark font-bold text-gray-800 mb-6">
            coming soon 🍿👇
          </h2>
          
          {/* YouTube Video */}
          <div className="mb-8 flex justify-center">
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube-nocookie.com/embed/Mr60m31MLu8?si=nX_XktDpXoDR32My" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
              className="rounded-lg border-4 border-gray-800 shadow-lg max-w-full"
              style={{ aspectRatio: '16/9' }}
            />
          </div>

          {/* CA Address */}
          <div className="mt-8">
            <button
              onClick={handleCopyCA}
              className="bg-orange-500 hover:bg-orange-600 text-white font-mono text-sm md:text-base py-4 px-6 rounded-full border-4 border-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg break-all"
            >
              {copySuccess ? '✅ Copied!' : 'BxL2Z6M96m5YiJRjTAbphHjE1Ldt1Eg8Vd4vNVBdpump'}
            </button>
            {!copySuccess && (
              <p className="text-gray-600 text-sm mt-2 font-southpark">
                👆 Click to copy CA address
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Not affiliated with South Park or Comedy Central. Just for fun! 
            <br />
            Oh my God, you used Parkify!
          </p>
        </div>
      </footer>

      {/* API Key Notice */}
      {(!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY.includes('your_ope')) && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-yellow-900 p-4 rounded-lg shadow-lg max-w-sm">
          <p className="text-sm font-semibold">
            ⚠️ API Key Issue: Check your Netlify environment variables
            <br />
            <small>Current: {import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) || 'undefined'}...</small>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;