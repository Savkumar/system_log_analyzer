import { useState, useRef } from 'react';

interface ARLTrafficUploaderProps {
  onRPMFileUploaded: (content: string) => void;
  onRPSFileUploaded: (content: string) => void;
}

const ARLTrafficUploader = ({ onRPMFileUploaded, onRPSFileUploaded }: ARLTrafficUploaderProps) => {
  const [rpmFileName, setRPMFileName] = useState<string>('');
  const [rpsFileName, setRPSFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const rpmFileInputRef = useRef<HTMLInputElement>(null);
  const rpsFileInputRef = useRef<HTMLInputElement>(null);
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
  
  const handleDrop = (e: React.DragEvent, fileType: 'rpm' | 'rps') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0], fileType);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'rpm' | 'rps') => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0], fileType);
    }
  };
  
  const handleFiles = (file: File, fileType: 'rpm' | 'rps') => {
    if (!file) return;
    
    // Check file type - accept txt files
    if (!file.name.endsWith('.txt') && !file.name.includes('ARL_')) {
      setError(`Please upload a valid ARL ${fileType.toUpperCase()} log file (.txt extension)`);
      return;
    }
    
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        
        if (fileType === 'rpm') {
          setRPMFileName(file.name);
          onRPMFileUploaded(content);
        } else {
          setRPSFileName(file.name);
          onRPSFileUploaded(content);
        }
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError(`Error reading the ARL ${fileType.toUpperCase()} log file. Make sure it is not corrupted.`);
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleFileInputClick = (fileType: 'rpm' | 'rps') => {
    if (fileType === 'rpm' && rpmFileInputRef.current) {
      rpmFileInputRef.current.click();
    } else if (fileType === 'rps' && rpsFileInputRef.current) {
      rpsFileInputRef.current.click();
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* RPM File Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          <i className="ri-file-list-line mr-2 text-blue-500"></i>
          Upload ARL RPM Log
        </h3>
        <div 
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
          }`}
          onDragEnter={(e) => handleDrag(e)}
          onDragOver={(e) => handleDrag(e)}
          onDragLeave={(e) => handleDrag(e)}
          onDrop={(e) => handleDrop(e, 'rpm')}
        >
          <input 
            ref={rpmFileInputRef}
            type="file" 
            accept=".txt,.log" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, 'rpm')}
          />
          
          <div className="text-center">
            <i className="ri-bar-chart-line text-3xl text-gray-400 mb-2"></i>
            <h4 className="font-medium mb-1">ARL Requests Per Minute</h4>
            {rpmFileName ? (
              <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 flex items-center justify-center">
                <i className="ri-file-text-line mr-2"></i>
                <span className="truncate max-w-xs">{rpmFileName}</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-2">Upload ARL_RPM.txt file</p>
                <button 
                  onClick={() => handleFileInputClick('rpm')}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  type="button"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* RPS File Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          <i className="ri-file-list-line mr-2 text-purple-500"></i>
          Upload ARL RPS Log
        </h3>
        <div 
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'
          }`}
          onDragEnter={(e) => handleDrag(e)}
          onDragOver={(e) => handleDrag(e)}
          onDragLeave={(e) => handleDrag(e)}
          onDrop={(e) => handleDrop(e, 'rps')}
        >
          <input 
            ref={rpsFileInputRef}
            type="file" 
            accept=".txt,.log" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, 'rps')}
          />
          
          <div className="text-center">
            <i className="ri-line-chart-line text-3xl text-gray-400 mb-2"></i>
            <h4 className="font-medium mb-1">ARL Requests Per Second</h4>
            {rpsFileName ? (
              <div className="mt-2 p-2 bg-purple-50 rounded text-purple-700 flex items-center justify-center">
                <i className="ri-file-text-line mr-2"></i>
                <span className="truncate max-w-xs">{rpsFileName}</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-2">Upload ARL_RPS.txt file</p>
                <button 
                  onClick={() => handleFileInputClick('rps')}
                  className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                  type="button"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <i className="ri-error-warning-line mt-0.5 mr-2 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="col-span-1 md:col-span-2 mt-2 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Processing file...</span>
        </div>
      )}
    </div>
  );
};

export default ARLTrafficUploader;