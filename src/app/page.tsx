"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [quality, setQuality] = useState<string>("85");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // TODO: Replace with actual Worker URL
    const response = await fetch("https://your-worker-url.workers.dev", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const { url } = await response.json();
      setUploadedImage(url);
      setTransformedImage(null);
    }
  };

  const applyTransform = () => {
    if (!uploadedImage) return;

    const options = [];
    if (width) options.push(`width=${width}`);
    if (height) options.push(`height=${height}`);
    if (quality) options.push(`quality=${quality}`);

    const transformUrl = `https://your-domain.com/cdn-cgi/image/${options.join(",")}/${uploadedImage}`;
    setTransformedImage(transformUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
        <h1 className="text-2xl font-bold">Image Transform App</h1>
        <ThemeToggle />
      </header>
      <main className="container mx-auto p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {uploadedImage && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Original Image</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploadedImage} alt="Uploaded" className="max-w-full h-auto" />
          </div>
        )}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Transform Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g. 300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g. 200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quality</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <button
            onClick={applyTransform}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply Transform
          </button>
        </div>
        {transformedImage && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Transformed Image</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={transformedImage} alt="Transformed" className="max-w-full h-auto" />
          </div>
        )}
      </main>
    </div>
  );
}
