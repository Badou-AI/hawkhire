import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  total?: number
  color: string
  explanation?: string[]
}

interface BulkJobProgressProps {
  stats: {
    totalFiles: number;
    processedCount: number;
    failedCount: number;
    processingTime: number;
    unsupportedCount?: number;
  };
  processingStatus?: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  currentFile?: string;
  error?: string;
  unsupportedFiles?: Array<{name: string, type: string, reason: string}>;
  organizationId: string;
  onClose?: () => void;
}

const ProgressCard = ({ icon, label, value, total, color, explanation }: ProgressCardProps) => (
  <div className={cn("p-4 rounded-lg bg-background/50", color)}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-lg font-semibold">
        {total ? `${value} / ${total}` : value}
      </span>
    </div>
    {explanation && explanation.length > 0 && (
      <div className="mt-2 text-sm text-muted-foreground">
        {explanation.map((text, i) => (
          <div key={i} className="flex items-start gap-1">
            <span>•</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

export const BulkJobProgress = ({ stats, processingStatus, currentFile, error, unsupportedFiles }: BulkJobProgressProps) => {
  const getFailureExplanations = () => {
    if (stats.failedCount === 0) return ["No failed files"]
    return [
      "Files failed during processing",
      "Check logs for detailed error messages",
      "Try processing these files individually"
    ]
  }

  const explanations: Record<string, string[]> = {
    unsupported: [
      "Only PDF and TXT files are supported",
      "Make sure all your job descriptions are in PDF or TXT format",
    ],
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <ProgressCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Processed"
          value={stats.processedCount}
          total={stats.totalFiles}
          color="border-green-100"
        />
        <ProgressCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          label="Failed"
          value={stats.failedCount}
          color="border-red-100"
          explanation={getFailureExplanations()}
        />
        <ProgressCard
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
          label="Unsupported"
          value={stats.unsupportedCount || 0}
          color="border-yellow-100"
          explanation={explanations.unsupported}
        />
      </div>

      {currentFile && processingStatus !== 'completed' && (
        <div className="text-sm text-muted-foreground">
          Processing: {currentFile}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500">
          Error: {error}
        </div>
      )}

      {unsupportedFiles && unsupportedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Unsupported Files:</h4>
          <ul className="text-sm text-muted-foreground">
            {unsupportedFiles.map((file, index) => (
              <li key={index} className="flex items-start gap-1">
                <span>•</span>
                <span>{file.name} ({file.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 