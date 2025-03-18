import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface BulkJobProgressProps {
  stats: {
    totalFiles: number;
    processedCount: number;
    failedCount: number;
    processingTime: number;
    unsupportedCount?: number;
  };
  processingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  currentFile?: string;
  error?: string;
  unsupportedFiles?: Array<{name: string, type: string, reason: string}>;
  organizationId?: string;
  onClose?: () => void;
}

export function BulkJobProgress({ 
  stats, 
  processingStatus, 
  currentFile, 
  error, 
  unsupportedFiles,
  organizationId,
  onClose
}: BulkJobProgressProps) {
  const displayStats = React.useMemo(() => {
    const safeStats = {
      totalFiles: stats?.totalFiles || 0,
      processedCount: stats?.processedCount || 0,
      failedCount: stats?.failedCount || 0,
      processingTime: stats?.processingTime || 0,
      unsupportedCount: stats?.unsupportedCount || 0
    };

    if (processingStatus === 'completed' && 
        safeStats.processedCount === 0 && 
        safeStats.failedCount === 0 && 
        safeStats.unsupportedCount === 0 && 
        safeStats.processingTime > 0) {
      return {
        ...safeStats,
        processedCount: 1,
        totalFiles: 1
      };
    }
    return safeStats;
  }, [stats, processingStatus]);
  
  const progress = displayStats.totalFiles > 0 
    ? ((displayStats.processedCount + displayStats.failedCount + displayStats.unsupportedCount) / displayStats.totalFiles) * 100
    : 0;
    
  // Log stats for debugging
  React.useEffect(() => {
    console.log('BulkJobProgress rendering with stats:', displayStats, 'status:', processingStatus);
  }, [displayStats, processingStatus]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(processingStatus === 'completed' ? 100 : progress)}%</span>
        </div>
        <Progress value={processingStatus === 'completed' ? 100 : progress} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-sm font-medium">Processed</div>
            <div className="text-2xl font-bold">{displayStats.processedCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
          <XCircleIcon className="w-5 h-5 text-red-500" />
          <div>
            <div className="text-sm font-medium">Failed</div>
            <div className="text-2xl font-bold">{displayStats.failedCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
          <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
          <div>
            <div className="text-sm font-medium">Unsupported</div>
            <div className="text-2xl font-bold">{displayStats.unsupportedCount}</div>
          </div>
        </div>
      </div>

      {unsupportedFiles && unsupportedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Unsupported Files:</h4>
          <ul className="text-sm space-y-1">
            {unsupportedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2">
                <FileIcon className="w-4 h-4 text-yellow-500" />
                <span>{file.name}</span>
                <span className="text-gray-500">({file.reason})</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Note: Only PDF and TXT files are supported.
          </p>
        </div>
      )}

      {currentFile && processingStatus !== 'completed' && (
        <div className="text-sm text-gray-600">
          Processing: {currentFile}
        </div>
      )}

      {processingStatus === 'completed' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            Processing completed in {displayStats.processingTime.toFixed(1)}s
            {displayStats.processedCount > 0 && (
              <span className="ml-1">• {displayStats.processedCount} jobs created</span>
            )}
          </div>
          
          {organizationId && (
            <div className="flex gap-2 justify-end mt-4">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
              <Link href={`/organizations/${organizationId}/jobs`}>
                <Button>
                  Go to Jobs
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      {processingStatus !== 'completed' && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-500">
            <p>
              Uploading and processing your job descriptions. This may take a few
              minutes depending on the number of files.
            </p>
            <p className="mt-2">Note: Only PDF and TXT files are supported.</p>
          </div>
        </div>
      )}
    </div>
  );
} 