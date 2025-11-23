import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GeneratedImage, AspectRatio } from '../types';

const MediaView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      if (imageUrl) {
        setGeneratedImages(prev => [{
          url: imageUrl,
          prompt: prompt
        }, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      alert("Failed to generate image. Try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">Media Studio</h2>
          <p className="text-slate-400 mt-2">Create stunning visuals with Gemini Flash Image.</p>
        </div>

        {/* Generator Controls */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create... (e.g., A futuristic city on Mars, neon lights, 4k)"
              className="w-full bg-slate-800 border-slate-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none h-32"
            />
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 font-medium">Aspect Ratio:</span>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:3">Standard (4:3)</option>
                  <option value="3:4">Vertical (3:4)</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Generating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedImages.map((img, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden bg-slate-800 aspect-square border border-slate-700/50">
              <img 
                src={img.url} 
                alt={img.prompt} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white text-sm line-clamp-2">{img.prompt}</p>
                <a 
                  href={img.url} 
                  download={`gemini-${idx}.png`}
                  className="mt-2 inline-flex items-center gap-2 text-xs text-purple-300 hover:text-white"
                >
                  <i className="fa-solid fa-download"></i> Download
                </a>
              </div>
            </div>
          ))}
          {generatedImages.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              <i className="fa-regular fa-image text-4xl mb-4 opacity-50"></i>
              <p>No images generated yet. Start dreaming!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaView;
