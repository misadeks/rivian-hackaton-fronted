'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Clock,
  MapPin,
  Gauge
} from 'lucide-react';
import { DriveData, TimelineEvent } from '@/types/driving';

interface DrivingTimelineProps {
  driveData: DriveData | null;
}

export function DrivingTimeline({ driveData }: DrivingTimelineProps) {
  if (!driveData) {
    return (
      <div className="w-96 max-w-96 min-w-80 border-l border-border bg-background h-full flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Drive Timeline
          </h2>
        </div>
        
        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a driving session to view timeline</p>
          </div>
        </div>
      </div>
    );
  }

  const getViolationSeverity = (violationId: string | null) => {
    if (!violationId) return null;
    
    // Mock violation types - you can expand this based on your actual violation types
    const violationTypes: Record<string, { severity: 'low' | 'medium' | 'high', name: string }> = {
      'speeding': { severity: 'high', name: 'Speeding' },
      'harsh_braking': { severity: 'medium', name: 'Harsh Braking' },
      'rapid_acceleration': { severity: 'medium', name: 'Rapid Acceleration' },
      'lane_departure': { severity: 'low', name: 'Lane Departure' },
      'tailgating': { severity: 'high', name: 'Following Too Close' },
    };

    return violationTypes[violationId] || { severity: 'low', name: violationId };
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatSpeed = (speed: number) => {
    return `${Math.round(speed)} mph`;
  };

  // Create timeline events including start, violations, and end
  const timelineEvents = [
    {
      id: 'start',
      timestamp: driveData.start_time,
      type: 'start' as const,
      title: 'Drive Started',
      description: 'Journey began',
      icon: Play,
    },
    ...driveData.timeline
      .filter(event => event.detected_violation)
      .map((event, index) => ({
        id: `violation-${index}`,
        timestamp: event.timestamp,
        type: 'violation' as const,
        title: getViolationSeverity(event.detected_violation)?.name || 'Violation',
        description: `Speed: ${formatSpeed(event.speed)} | Location: ${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`,
        severity: getViolationSeverity(event.detected_violation)?.severity || 'low',
        icon: AlertTriangle,
        event,
      })),
    {
      id: 'end',
      timestamp: driveData.end_time,
      type: 'end' as const,
      title: 'Drive Ended',
      description: 'Journey completed',
      icon: Square,
    },
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="w-96 max-w-96 min-w-80 border-l border-border bg-background h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Drive Timeline
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <span>{timelineEvents.length} events</span>
          <Badge variant="outline">
            Score: {driveData.score}
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-6 py-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-6">
                  {timelineEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    const isViolation = event.type === 'violation';
                    
                    return (
                      <div key={event.id} className="relative flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className={`
                          relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-background
                          ${event.type === 'start' ? 'bg-green-500' : 
                            event.type === 'end' ? 'bg-gray-500' : 
                            getSeverityColor(event.severity!)}
                        `}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.description}
                          </p>
                          
                          {isViolation && 'event' in event && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <Gauge className="w-3 h-3" />
                                  <span>{formatSpeed(event.event.speed)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>GPS</span>
                                </div>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs text-white ${getSeverityColor(event.severity!)}`}
                              >
                                {event.severity?.toUpperCase()} SEVERITY
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}