import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";

interface BulkJobProgressProps {
  stats: {
    totalFiles: number;
    processedCount: number;
    failedCount: number;
    processingTime: number;
  };
  processingStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  currentFile?: string;
  error?: string;
}

export function BulkJobProgress({ stats, processingStatus, currentFile, error }: BulkJobProgressProps) {
  const progress = stats.totalFiles > 0 
    ? ((stats.processedCount + stats.failedCount) / stats.totalFiles) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-sm font-medium">Processed</div>
            <div className="text-2xl font-bold">{stats.processedCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
          <XCircleIcon className="w-5 h-5 text-red-500" />
          <div>
            <div className="text-sm font-medium">Failed</div>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
          </div>
        </div>
      </div>

      {currentFile && (
        <div className="text-sm text-gray-600">
          Processing: {currentFile}
        </div>
      )}

      {processingStatus === 'completed' && (
        <div className="text-sm text-gray-600">
          Completed in {stats.processingTime.toFixed(1)}s
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}
    </div>
  );
} 