import { useState, useRef } from 'react';

interface GhostmonLogUploaderProps {
  onFileUploaded: (content: string) => void;
}

const GhostmonLogUploader = ({ onFileUploaded }: GhostmonLogUploaderProps) => {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = (file: File) => {
    if (!file) return;
    
    // Check file type - accept txt, log, and compressed .gz files
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.log') && 
        !file.name.endsWith('.gz') && !file.name.includes('ghostmon')) {
      setError('Please upload a valid ghostmon log file (.txt, .log, or .gz extension).');
      return;
    }
    
    setIsLoading(true);
    
    // Special handling for .gz files
    if (file.name.endsWith('.gz')) {
      setFileName(file.name);
      
      // We need to upload the file to the server and let it handle decompression
      const formData = new FormData();
      formData.append('file', file);
      
      // Use fetch to upload the file to the server
      fetch('/api/upload/ghostmon', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Server error: ' + response.statusText);
        }
        return response.text();
      })
      .then(content => {
        onFileUploaded(content);
        setIsLoading(false);
      })
      .catch(err => {
        setError('Error processing the compressed log file: ' + err.message);
        setIsLoading(false);
      });
      
      return;
    }
    
    // For uncompressed files, read directly in the browser
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        setFileName(file.name);
        onFileUploaded(content);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the ghostmon log file. Make sure it is not corrupted.');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-upload-cloud-line mr-2 text-primary"></i>
        Upload Ghostmon Log File
      </h2>
      
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".txt,.log" 
          className="hidden" 
          onChange={handleFileChange}
        />
        
        <div className="text-center">
          <i className="ri-file-chart-line text-5xl text-gray-400 mb-2"></i>
          <h3 className="font-medium mb-1">Ghostmon Log File</h3>
          
          {fileName ? (
            <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 flex items-center justify-center">
              <i className="ri-file-text-line mr-2"></i>
              <span className="truncate max-w-xs">{fileName}</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">Drag & drop your ghostmon log file here or click to browse</p>
              <p className="text-xs text-gray-400 mb-4">The file needs to be in text format (uncompressed)</p>
              <button 
                onClick={handleFileInputClick}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                type="button"
              >
                Browse Files
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <i className="ri-error-warning-line mt-0.5 mr-2 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Processing file...</span>
        </div>
      )}
    </div>
  );
};

export default GhostmonLogUploader;