"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://api.snubs.dev", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setUploadedImage(url);
        setTransformedImage(null);
      } else {
        alert("Upload failed");
      }
    } catch {
      alert("Upload error");
    } finally {
      setLoading(false);
    }
  };

  const removeBackground = () => {
    if (!uploadedImage) return;

    const transformUrl = `https://snubs.dev/cdn-cgi/image/segment=foreground/${uploadedImage}`;
    setTransformedImage(transformUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="flex justify-between items-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Background Remover</h1>
        <ThemeToggle />
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Upload an Image to Remove Background</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={loading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-300 disabled:opacity-50"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {uploadedImage && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Uploaded Image</h2>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-96 rounded-lg shadow-md" />
            </div>
          </div>
        )}

        {uploadedImage && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <button
                onClick={removeBackground}
                disabled={!uploadedImage}
                className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                Remove Background
              </button>
            </div>
          </div>
        )}

        {transformedImage && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Background Removed</h2>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={transformedImage} alt="Transformed" className="max-w-full max-h-96 rounded-lg shadow-md" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
