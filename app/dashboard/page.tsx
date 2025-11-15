'use client';

import { useState, useEffect } from 'react';
import { SessionSidebar } from '@/components/session-sidebar';
import { VideoPlayer } from '@/components/video-player';
import { DrivingTimeline } from '@/components/driving-timeline';
import { ScoreBadge } from '@/components/score-badge';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DriveData } from '@/types/driving';

export default function DashboardPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedSessionData, setSelectedSessionData] = useState<DriveData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch session data when a session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchSessionData(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessionData = async (sessionId: string) => {
    setLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch(`http://localhost:5000/api/drive/${sessionId}`);
      const data = await response.json();
      
      // Mock data for now
      // const mockData: DriveData = {
      //   id: sessionId,
      //   start_time: '2024-11-13T14:40:56Z',
      //   end_time: '2024-11-13T15:20:30Z',
      //   score: sessionId === '1' ? 85 : sessionId === '2' ? 92 : 76,
      //   timeline: [
      //     {
      //       timestamp: '2024-11-13T14:45:30Z',
      //       latitude: 44.79403305,
      //       longitude: 20.42661285,
      //       speed: 35.5,
      //       limit: 50,
      //       detected_violation: null
      //     },
      //     {
      //       timestamp: '2024-11-13T14:52:15Z',
      //       latitude: 44.79403305,
      //       longitude: 20.42661285,
      //       speed: 58.2,
      //       limit: 50,
      //       detected_violation: sessionId === '1' ? 'stop_sign_violation' : null
      //     },
      //     {
      //       timestamp: '2024-11-13T15:05:45Z',
      //       latitude: 40.7180,
      //       longitude: -74.0100,
      //       speed: 42.1,
      //       limit: 50,
      //       detected_violation: sessionId === '1' ? 'harsh_braking' : null
      //     },
      //     {
      //       timestamp: '2024-11-13T15:15:22Z',
      //       latitude: 40.7200,
      //       longitude: -74.0120,
      //       speed: 28.8,
      //       limit: 40,
      //       detected_violation: sessionId === '3' ? 'lane_departure' : null
      //     }
      //   ]
      // };
      
      setSelectedSessionData(data);
    } catch (error) {
      console.error('Failed to fetch session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex bg-background overflow-hidden">
        {/* Left Sidebar - Session Selection */}
        <SessionSidebar
          selectedSession={selectedSession}
          onSessionSelect={handleSessionSelect}
          selectedSessionData={selectedSessionData}
        />

        {/* Main Content Area */}
        <SidebarInset className="flex-1 w-full max-w-none min-w-0">
          {/* Header with sidebar trigger */}
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>
          
          <div className="flex h-full w-full">
            {/* Video Player Section */}
            <div className={`${selectedSession ? 'flex-[2]' : 'flex-1'} min-w-0 relative flex flex-col`}>
              <VideoPlayer sessionId={selectedSession} driveData={selectedSessionData} />
              
              {/* Score Badge Overlay */}
              <ScoreBadge driveData={selectedSessionData} />
              
              {/* Loading State */}
              {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
                  <div className="bg-background p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span>Loading session data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Timeline - Only show when session is selected */}
            {selectedSession && (
              <DrivingTimeline driveData={selectedSessionData} />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
