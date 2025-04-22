import { useState, useRef } from 'react';

interface FileSet {
  overall: {
    rpm: File | null;
    rps: File | null;
  };
  arl: {
    rpm: File | null;
    rps: File | null;
  };
  withoutArl: {
    rpm: File | null;
    rps: File | null;
  };
}

interface UnifiedTrafficUploaderProps {
  onFilesUploaded: (data: {
    overall: { rpm: string; rps: string };
    arl: { rpm: string; rps: string };
    withoutArl: { rpm: string; rps: string };
  }) => void;
}

const UnifiedTrafficUploader = ({ onFilesUploaded }: UnifiedTrafficUploaderProps) => {
  const [files, setFiles] = useState<FileSet>({
    overall: { rpm: null, rps: null },
    arl: { rpm: null, rps: null },
    withoutArl: { rpm: null, rps: null }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categorizeFile = (file: File): { category: keyof FileSet; type: 'rpm' | 'rps' } | null => {
    const filename = file.name.toLowerCase();
    
    if (!filename.endsWith('.txt') && !filename.endsWith('.log')) {
      return null;
    }
    
    if (filename.startsWith('overall_')) {
      return {
        category: 'overall',
        type: filename.includes('rpm') ? 'rpm' : 'rps'
      };
    } else if (filename.startsWith('arl_')) {
      return {
        category: 'arl',
        type: filename.includes('rpm') ? 'rpm' : 'rps'
      };
    } else if (filename.startsWith('without_arl_')) {
      return {
        category: 'withoutArl',
        type: filename.includes('rpm') ? 'rpm' : 'rps'
      };
    }
    
    return null;
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await processFiles(selectedFiles);
    }
  };
  
  const processFiles = async (newFiles: File[]) => {
    setIsLoading(true);
    const updatedFiles = { ...files };
    let hasError = false;
    
    for (const file of newFiles) {
      const categorization = categorizeFile(file);
      
      if (!categorization) {
        setError(`Invalid file: ${file.name}. File name must start with 'Overall_', 'ARL_', or 'Without_ARL_' and include 'RPM' or 'RPS'.`);
        hasError = true;
        break;
      }
      
      const { category, type } = categorization;
      updatedFiles[category][type] = file;
    }
    
    if (!hasError) {
      setFiles(updatedFiles);
      await checkAndProcessFiles(updatedFiles);
    }
    
    setIsLoading(false);
  };
  
  const checkAndProcessFiles = async (fileSet: FileSet) => {
    const fileContents: {
      overall: { rpm: string; rps: string };
      arl: { rpm: string; rps: string };
      withoutArl: { rpm: string; rps: string };
    } = {
      overall: { rpm: '', rps: '' },
      arl: { rpm: '', rps: '' },
      withoutArl: { rpm: '', rps: '' }
    };

    let allFilesPresent = true;
    
    for (const [category, files] of Object.entries(fileSet)) {
      if (!files.rpm || !files.rps) {
        allFilesPresent = false;
        break;
      }
      
      try {
        const [rpmContent, rpsContent] = await Promise.all([
          readFileContent(files.rpm),
          readFileContent(files.rps)
        ]);
        
        fileContents[category as keyof FileSet] = {
          rpm: rpmContent,
          rps: rpsContent
        };
      } catch (err) {
        setError(`Error reading files for ${category}: ${err}`);
        return;
      }
    }
    
    if (allFilesPresent) {
      onFilesUploaded(fileContents);
    }
  };
  
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  };
  
  const getFileStatus = (category: keyof FileSet) => {
    const categoryFiles = files[category];
    if (categoryFiles.rpm && categoryFiles.rps) {
      return 'complete';
    } else if (categoryFiles.rpm || categoryFiles.rps) {
      return 'partial';
    }
    return 'empty';
  };
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-upload-cloud-line mr-2 text-primary"></i>
        Upload Traffic Log Files
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
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
            multiple
            accept=".txt,.log"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <div className="text-center">
            <i className="ri-file-upload-line text-5xl text-gray-400 mb-2"></i>
            <h3 className="font-medium mb-1">Upload All Traffic Log Files</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag & drop your RPM and RPS files or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              type="button"
            >
              Browse Files
            </button>
          </div>
        </div>
        
        {/* File Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {(['overall', 'arl', 'withoutArl'] as const).map((category) => (
            <div
              key={category}
              className={`p-4 rounded-lg ${
                getFileStatus(category) === 'complete'
                  ? 'bg-green-50 border border-green-200'
                  : getFileStatus(category) === 'partial'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h4 className="font-medium mb-2 capitalize">
                {category === 'withoutArl' ? 'Without ARL' : category} Files
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <i className={`ri-file-list-line mr-2 ${files[category].rpm ? 'text-green-500' : 'text-gray-400'}`}></i>
                  <span>RPM: {files[category].rpm?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex items-center">
                  <i className={`ri-file-list-line mr-2 ${files[category].rps ? 'text-green-500' : 'text-gray-400'}`}></i>
                  <span>RPS: {files[category].rps?.name || 'Not uploaded'}</span>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default UnifiedTrafficUploader;