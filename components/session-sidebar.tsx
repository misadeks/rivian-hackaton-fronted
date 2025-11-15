'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Calendar, Clock, MapPin, Car } from 'lucide-react';
import { DrivingSession, DriveData } from '@/types/driving';

interface SessionSidebarProps {
  selectedSession: string | null;
  onSessionSelect: (sessionId: string) => void;
  selectedSessionData: DriveData | null;
}

export function SessionSidebar({ 
  selectedSession, 
  onSessionSelect, 
  selectedSessionData
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { open } = useSidebar();

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/drives');
        const data = await response.json();
        
        // Mock data
        const mockSessions: DrivingSession[] = [
          {
            id: '1',
            start_time: '2024-11-13T14:40:56Z',
            end_time: '2024-11-13T15:20:30Z'
          },
          {
            id: '2', 
            start_time: '2024-11-12T09:15:20Z',
            end_time: '2024-11-12T10:45:15Z'
          },
          {
            id: '3',
            start_time: '2024-11-11T16:30:45Z', 
            end_time: '2024-11-11T17:15:22Z'
          }
        ];
        
        setSessions(data);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    return `${duration} min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        {open ? (
          <div className="flex items-center">
            <div className="flex items-center justify-center py-4">
            <div className="w-12 h-12 rounded-lg bg-white-500 flex items-center justify-center p-2">
              <img src="/Rivian_logo.svg" alt="Rivian" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-2">
            <h2 className="text-lg font-semibold">Driving Sessions</h2>
            <p className="text-sm text-muted-foreground">
              Select a session to view details
            </p>
          </div>
          </div>
          
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="w-12 h-12 rounded-lg bg-white-500 flex items-center justify-center p-2">
              <img src="/Rivian_logo.svg" alt="Rivian" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
      </SidebarHeader>
      
      {open && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Sessions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton className="animate-pulse h-12">
                          <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-muted rounded w-1/2"></div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton 
                        onClick={() => onSessionSelect(session.id)}
                        isActive={selectedSession === session.id}
                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground h-auto min-h-[48px] p-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold">{session.id}</span>
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0 ml-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm truncate">
                              Session {session.id}
                            </span>
                            {selectedSessionData && selectedSession === session.id && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs text-white flex-shrink-0 ml-2 ${getScoreColor(selectedSessionData.score)}`}
                              >
                                {selectedSessionData.score}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                            <span className="truncate flex-1">
                              {new Date(session.start_time).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <Clock className="w-3 h-3" />
                              <span>{getDuration(session.start_time, session.end_time)}</span>
                            </div>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}

    </Sidebar>
  );
}