import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LogFileUploaderProps {
  onFileUploaded: () => void;
}

const LogFileUploader = ({ onFileUploaded }: LogFileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.gz')) {
      toast({
        title: 'Invalid file format',
        description: 'Please select a .gz file',
        variant: 'destructive',
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a .gz file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logFile', file);

      const response = await fetch('/api/upload-log', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Upload successful',
          description: `Log file processed with ${result.lines} lines`,
          variant: 'default',
        });
        onFileUploaded();
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Error uploading log file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <i className="ri-upload-cloud-line mr-2 text-primary"></i>
        Upload Gzipped Log File
      </h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <i className="ri-file-zip-line text-4xl text-gray-400 mb-4"></i>
          
          {file ? (
            <div className="mb-4">
              <div className="font-medium mb-1">{file.name}</div>
              <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Drag and drop a .gz file here, or click to select</p>
              <p className="text-xs text-gray-500">Only .gz files are supported</p>
            </div>
          )}
          
          <label className="mb-4">
            <input 
              type="file" 
              accept=".gz" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 cursor-pointer">
              {file ? 'Choose a different file' : 'Select File'}
            </span>
          </label>
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`px-6 py-2 rounded-md ${
              !file || uploading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {uploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : 'Upload and Process'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogFileUploader;