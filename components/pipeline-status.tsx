import { PipelineStage } from '@/lib/store/pipeline-store';

const stages: { id: PipelineStage; label: string }[] = [
  { id: 'phoneScreen', label: 'New Application' },
  { id: 'technical', label: 'Review' },
  { id: 'cultural', label: 'Interview 1' },
  { id: 'offer', label: 'Interview 2' }
]

export function PipelineStatus({ currentStage }: { currentStage?: PipelineStage }) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center gap-1">
          <div 
            className={`h-1.5 w-4 rounded ${
              currentStage && stages.findIndex(s => s.id === currentStage) >= index
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
          <span className="text-[10px] text-muted-foreground">{stage.label}</span>
        </div>
      ))}
    </div>
  )
} 