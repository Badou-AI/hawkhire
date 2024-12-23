'use client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePipelineStore, PipelineStage } from '@/lib/store/pipeline-store';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Candidate {
  id: string
  name: string
  role: string
  score: number
  imageUrl: string
  interviewLink?: string
  scheduledTime?: string
}

interface Column {
  id: string
  title: string
  candidates: Candidate[]
}

export default function HiringPipeline() {
  const { getCandidatesByStage, updateCandidateStage } = usePipelineStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return;

    // Initialize columns after component mounts and hydration is complete
    const initialColumns: Column[] = [
      {
        id: 'phoneScreen',
        title: 'AI Phone Screen',
        candidates: getCandidatesByStage('phoneScreen')
      },
      {
        id: 'technical',
        title: 'Technical Interview',
        candidates: getCandidatesByStage('technical')
      },
      {
        id: 'cultural',
        title: 'Cultural Fit',
        candidates: getCandidatesByStage('cultural')
      },
      {
        id: 'offer',
        title: 'Offer Stage',
        candidates: getCandidatesByStage('offer')
      },
      {
        id: 'hired',
        title: 'Hired',
        candidates: getCandidatesByStage('hired')
      },
      {
        id: 'rejected',
        title: 'Did Not Work Out',
        candidates: getCandidatesByStage('rejected')
      }
    ]
    setColumns(initialColumns)
    setIsLoading(false)
  }, [isHydrated, getCandidatesByStage])

  const onDragEnd = (result: {
    destination?: { droppableId: string; index: number };
    source: { droppableId: string; index: number };
    draggableId: string;
  }) => {
    const { destination, draggableId } = result
    if (!destination) return
    
    updateCandidateStage(draggableId, destination.droppableId as PipelineStage)
    
    // Update local state to reflect the change
    const updatedColumns = columns.map(column => ({
      ...column,
      candidates: getCandidatesByStage(column.id as PipelineStage)
    }))
    setColumns(updatedColumns)
  }

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = 300; // Adjust this value to control scroll distance
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const scrollToColumn = (columnId: string) => {
    const columnElement = document.querySelector(`[data-column-id="${columnId}"]`);
    if (columnElement) {
      columnElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Calculate stats from actual data
  const calculateStats = () => {
    if (!columns.length) return null;
    
    const totalCandidates = columns.reduce((sum, col) => sum + col.candidates.length, 0);
    const hired = columns.find(col => col.id === 'hired')?.candidates.length || 0;
    const rejected = columns.find(col => col.id === 'rejected')?.candidates.length || 0;
    const inProgress = totalCandidates - hired - rejected;
    const averageScore = Math.round(
      columns.reduce((sum, col) => 
        sum + col.candidates.reduce((colSum, candidate) => colSum + candidate.score, 0), 0
      ) / totalCandidates
    );

    return {
      totalCandidates,
      inProgress,
      hired,
      rejected,
      averageScore
    };
  };

  // Mock job data - in real app this would come from a job store/API
  const jobDetails = {
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    stats: calculateStats() || {
      totalCandidates: 0,
      inProgress: 0,
      hired: 0,
      rejected: 0,
      averageScore: 0
    }
  }

  // Show loading state during hydration or data loading
  if (!isHydrated || isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 space-y-4 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/jobs">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold">{jobDetails.title}</h1>
                  <Badge variant="secondary" className="mt-1">
                    {jobDetails.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{jobDetails.totalCandidates} Total Candidates</span>
                  </div>
                  <span>•</span>
                  <span>{jobDetails.inProgress} In Progress</span>
                  <span>•</span>
                  <span>{jobDetails.hired} Hired</span>
                  <span>•</span>
                  <span>{jobDetails.averageScore}% Average Match</span>
                  <span>•</span>
                  <span>{jobDetails.department}</span>
                  <span>•</span>
                  <span>{jobDetails.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 p-6">
          {[...Array(4)].map((_, i) => (
            <div key={`loading-${i}`} className="bg-secondary/30 rounded-lg p-4 h-[200px] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 space-y-4 mb-6 p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/jobs">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold">{jobDetails.title}</h1>
                <Badge variant="secondary" className="mt-1">
                  {jobDetails.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{jobDetails.stats.totalCandidates}</span>
                  <span className="text-muted-foreground/60">candidates</span>
                </div>
                <span className="text-muted-foreground/40 px-2">•</span>
                <div className="flex items-center gap-2">
                  <span>{jobDetails.stats.inProgress}</span>
                  <span className="text-muted-foreground/60">in progress</span>
                </div>
                <span className="text-muted-foreground/40 px-2">•</span>
                <div className="flex items-center gap-2">
                  <span>{jobDetails.stats.hired}</span>
                  <span className="text-muted-foreground/60">hired</span>
                </div>
                <span className="text-muted-foreground/40 px-2">•</span>
                <div className="flex items-center gap-2">
                  <span>{jobDetails.stats.averageScore}%</span>
                  <span className="text-muted-foreground/60">average match</span>
                </div>
                <span className="text-muted-foreground/40 px-2">•</span>
                <span>{jobDetails.department}</span>
                <span className="text-muted-foreground/40 px-2">•</span>
                <span>{jobDetails.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              View All Candidates
            </Button>
          </div>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="relative flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md hidden md:flex"
            onClick={() => scrollTo('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-6 p-6 overflow-x-auto pb-4 absolute inset-0 scroll-smooth"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {columns.map(column => (
              <div 
                key={column.id}
                data-column-id={column.id}
                className={cn(
                  "bg-secondary/30 rounded-lg p-4 w-[280px] shrink-0 first:ml-0",
                  (column.id === 'hired' || column.id === 'rejected') && "bg-background border"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      column.id === 'phoneScreen' && "bg-blue-500",
                      column.id === 'technical' && "bg-purple-500",
                      column.id === 'cultural' && "bg-orange-500",
                      column.id === 'offer' && "bg-yellow-500",
                      column.id === 'hired' && "bg-green-500",
                      column.id === 'rejected' && "bg-red-500"
                    )} />
                    <h2 className={cn(
                      "font-semibold text-xs uppercase tracking-wider",
                      column.id === 'hired' && "text-green-700 dark:text-green-300",
                      column.id === 'rejected' && "text-red-700 dark:text-red-300"
                    )}>
                      {column.title}
                    </h2>
                  </div>
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    column.id === 'hired' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    column.id === 'rejected' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  )}>
                    {column.candidates.length}
                  </Badge>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "space-y-2 min-h-[4rem] rounded-sm transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
                      )}
                    >
                      {column.candidates.map((candidate, index) => (
                        <Draggable
                          key={candidate.id}
                          draggableId={candidate.id}
                          index={index}
                          isDragDisabled={false}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-background hover:border-primary/50 transition-colors",
                                snapshot.isDragging && "ring-2 ring-primary shadow-lg",
                                column.id === 'hired' && "hover:border-green-500/50",
                                column.id === 'rejected' && "hover:border-red-500/50"
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={candidate.imageUrl} alt={candidate.name} />
                                    <AvatarFallback className="text-xs">{candidate.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-xs font-medium leading-none truncate">{candidate.name}</h3>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                      {candidate.role}
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={candidate.score >= 85 ? "default" : "secondary"}
                                    className={cn(
                                      "shrink-0 text-[10px] px-1.5 py-0.5 font-medium", 
                                      candidate.score >= 85 ? "bg-green-100 text-green-800" : "",
                                      column.id === 'hired' && "bg-green-100 text-green-800",
                                      column.id === 'rejected' && "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {candidate.score}
                                  </Badge>
                                </div>
                                {(candidate.scheduledTime || candidate.interviewLink) && (
                                  <div className="mt-2 border-t pt-2">
                                    {candidate.scheduledTime && (
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <span className="shrink-0">📅</span>
                                        <span className="truncate">{candidate.scheduledTime}</span>
                                      </div>
                                    )}
                                    {candidate.interviewLink && (
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <span className="shrink-0">🔗</span>
                                        <span className="truncate">{candidate.interviewLink}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {column.candidates.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-sm">
                          Drop candidate here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-md hidden md:flex"
            onClick={() => scrollTo('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent" />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 p-1 rounded-full bg-background/80 backdrop-blur-sm shadow-sm">
            {columns.map((column) => (
              <button
                key={column.id}
                onClick={() => scrollToColumn(column.id)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all hover:scale-125",
                  column.id === 'phoneScreen' && "bg-blue-500",
                  column.id === 'technical' && "bg-purple-500",
                  column.id === 'cultural' && "bg-orange-500",
                  column.id === 'offer' && "bg-yellow-500",
                  column.id === 'hired' && "bg-green-500",
                  column.id === 'rejected' && "bg-red-500",
                  "opacity-40 hover:opacity-100"
                )}
                title={column.title}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
} 