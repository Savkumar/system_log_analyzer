import { useState, useRef } from 'react';

interface GhostTrafficUploaderProps {
  onFilesUploaded: (rpmContent: string, rpsContent: string) => void;
}

const GhostTrafficUploader = ({ onFilesUploaded }: GhostTrafficUploaderProps) => {
  const [rpmFileName, setRpmFileName] = useState<string>('');
  const [rpsFileName, setRpsFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const rpmFileInputRef = useRef<HTMLInputElement>(null);
  const rpsFileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // For tracking which file is being picked (rpm or rps)
  const [activeFileType, setActiveFileType] = useState<'rpm' | 'rps' | null>(null);
  
  // Store the file contents
  const [rpmContent, setRpmContent] = useState<string | null>(null);
  const [rpsContent, setRpsContent] = useState<string | null>(null);
  
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
    
    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.log')) {
      setError(`Invalid file format. Please upload a .txt or .log file for ${fileType.toUpperCase()}.`);
      return;
    }
    
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string;
        
        if (fileType === 'rpm') {
          setRpmFileName(file.name);
          setRpmContent(content);
        } else {
          setRpsFileName(file.name);
          setRpsContent(content);
        }
        
        // If both files are loaded, process them
        if (
          (fileType === 'rpm' && rpsContent) || 
          (fileType === 'rps' && rpmContent)
        ) {
          const rpmData = fileType === 'rpm' ? content : rpmContent!;
          const rpsData = fileType === 'rps' ? content : rpsContent!;
          onFilesUploaded(rpmData, rpsData);
        }
        
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError(`Error reading the ${fileType.toUpperCase()} file.`);
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const handleFileInputClick = (fileType: 'rpm' | 'rps') => {
    setActiveFileType(fileType);
    
    if (fileType === 'rpm' && rpmFileInputRef.current) {
      rpmFileInputRef.current.click();
    } else if (fileType === 'rps' && rpsFileInputRef.current) {
      rpsFileInputRef.current.click();
    }
  };
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-upload-cloud-line mr-2 text-primary"></i>
        Upload Ghost Traffic Log Files
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RPM File Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive && activeFileType === 'rpm' ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragEnter={(e) => { setActiveFileType('rpm'); handleDrag(e); }}
          onDragOver={(e) => { setActiveFileType('rpm'); handleDrag(e); }}
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
            <i className="ri-file-chart-line text-5xl text-gray-400 mb-2"></i>
            <h3 className="font-medium mb-1">RPM Log File</h3>
            
            {rpmFileName ? (
              <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 flex items-center justify-center">
                <i className="ri-file-text-line mr-2"></i>
                <span className="truncate max-w-xs">{rpmFileName}</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Drag & drop your Requests Per Minute (RPM) log file here or click to browse</p>
                <button 
                  onClick={() => handleFileInputClick('rpm')}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                  type="button"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* RPS File Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive && activeFileType === 'rps' ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragEnter={(e) => { setActiveFileType('rps'); handleDrag(e); }}
          onDragOver={(e) => { setActiveFileType('rps'); handleDrag(e); }}
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
            <i className="ri-file-chart-2-line text-5xl text-gray-400 mb-2"></i>
            <h3 className="font-medium mb-1">RPS Log File</h3>
            
            {rpsFileName ? (
              <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 flex items-center justify-center">
                <i className="ri-file-text-line mr-2"></i>
                <span className="truncate max-w-xs">{rpsFileName}</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Drag & drop your Requests Per Second (RPS) log file here or click to browse</p>
                <button 
                  onClick={() => handleFileInputClick('rps')}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
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
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <i className="ri-error-warning-line mt-0.5 mr-2 flex-shrink-0"></i>
          <span>{error}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Processing files...</span>
        </div>
      )}
      
      {rpmContent && rpsContent && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-start">
          <i className="ri-checkbox-circle-line mt-0.5 mr-2 flex-shrink-0"></i>
          <span>Both RPM and RPS files are loaded. Traffic analysis is ready.</span>
        </div>
      )}
    </div>
  );
};

export default GhostTrafficUploader;