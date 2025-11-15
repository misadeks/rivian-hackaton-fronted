'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Car } from 'lucide-react';
import { VideoAngles, DriveData } from '@/types/driving';

interface VideoPlayerProps {
  sessionId: string | null;
  driveData?: DriveData | null;
}

export function VideoPlayer({ sessionId, driveData }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  
  const frontCenterRef = useRef<HTMLVideoElement>(null);
  const frontLeftRef = useRef<HTMLVideoElement>(null);
  const frontRightRef = useRef<HTMLVideoElement>(null);
  const rearRef = useRef<HTMLVideoElement>(null);

  const getVideoSources = (sessionId: string): VideoAngles => ({
    frontCenter: `http://localhost:5000/video/${sessionId}-frontCenter.mp4`,
    frontLeft: `http://localhost:5000/video/${sessionId}-sideLeft.mp4`,
    frontRight: `http://localhost:5000/video/${sessionId}-sideRight.mp4`,
    rear: `http://localhost:5000/video/${sessionId}-rearCenter.mp4`,
  });

  // Get all video refs as array
  const getAllVideoRefs = () => {
    return [frontCenterRef, frontLeftRef, frontRightRef, rearRef]
      .map(ref => ref.current)
      .filter(Boolean) as HTMLVideoElement[];
  };

  // Reset state when session changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setLoadedVideos(new Set());
  }, [sessionId]);

  // Check if all videos are loaded
  useEffect(() => {
    if (loadedVideos.size >= 4) {
      setIsLoading(false);
    }
  }, [loadedVideos]);

  const togglePlayback = async () => {
    const videos = getAllVideoRefs();
    
    if (isPlaying) {
      // Pause all videos
      videos.forEach(video => video.pause());
      setIsPlaying(false);
    } else {
      // Play all videos
      try {
        await Promise.all(videos.map(video => video.play()));
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing videos:', error);
      }
    }
  };

  const handleSeek = (time: number) => {
    const videos = getAllVideoRefs();
    videos.forEach(video => {
      video.currentTime = time;
    });
    setCurrentTime(time);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleVideoLoaded = (cameraKey: string) => (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
    setLoadedVideos(prev => new Set(prev).add(cameraKey));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get violation details - same as timeline component
  const getViolationDetails = (violationId: string | null) => {
    if (!violationId) return null;
    
    const violationTypes: Record<string, { severity: 'low' | 'medium' | 'high', name: string, color: string }> = {
      'speeding': { severity: 'high', name: 'Speeding', color: 'bg-red-500' },
      'harsh_braking': { severity: 'medium', name: 'Harsh Braking', color: 'bg-yellow-500' },
      'rapid_acceleration': { severity: 'medium', name: 'Rapid Acceleration', color: 'bg-yellow-500' },
      'lane_departure': { severity: 'low', name: 'Lane Departure', color: 'bg-blue-500' },
      'tailgating': { severity: 'high', name: 'Following Too Close', color: 'bg-red-500' },
      'stop_sign_violation': { severity: 'high', name: 'Stop Sign Violation', color: 'bg-red-500' },
    };

    return violationTypes[violationId] || { severity: 'low', name: violationId, color: 'bg-blue-500' };
  };

  // Calculate marker positions for timeline events with violations
  const getMarkerPositions = () => {
    if (!driveData || !driveData.timeline || duration === 0) return [];
    
    const startTime = new Date(driveData.start_time).getTime();
    const endTime = new Date(driveData.end_time).getTime();
    // const totalDuration = (endTime - startTime) / 1000; // in seconds
    const totalDuration = driveData.duration || duration; // in seconds
    // Only include events with violations (matching timeline behavior)
    return driveData.timeline
      .filter(event => event.detected_violation)
      .map(event => {
        // const eventTime = new Date(event.timestamp).getTime();
        const eventPosition = (event.time_since_start) / totalDuration * 100; // percentage
        const violationDetails = getViolationDetails(event.detected_violation);
        
        return {
          position: eventPosition,
          violation: event.detected_violation,
          violationName: violationDetails?.name || event.detected_violation,
          severity: violationDetails?.severity || 'low',
          color: violationDetails?.color || 'bg-blue-500',
          timestamp: event.timestamp,
          speed: event.speed
        };
      });
  };

  const markers = getMarkerPositions();

  // Empty state
  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Select a Driving Session</h3>
          <p className="text-sm text-muted-foreground">
            Choose a session from the sidebar to view videos
          </p>
        </div>
      </div>
    );
  }

  const videoSources = getVideoSources(sessionId);

  return (
    <div className="flex-1 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4">
        {/* Cross pattern layout */}
        <div className="h-full w-full relative">
            {/* {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-white text-sm">Loading videos...</p>
                  <p className="text-white/60 text-xs">{loadedVideos.size} / 4 cameras ready</p>
                </div>
              </div>
            )} */}
            {/* Front Center - Top */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-[555px] h-[310px]">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video h-full">
                <video
                  key={`frontCenter-${sessionId}`}
                  ref={frontCenterRef}
                  src={videoSources.frontCenter}
                  className="w-full h-full object-cover"
                  muted
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleVideoLoaded('frontCenter')}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                    Front
                  </span>
                </div>
              </div>
            </div>

            {/* Front Left - Left */}
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-[434px] h-[240px]">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video h-full">
                <video
                  key={`frontLeft-${sessionId}`}
                  ref={frontLeftRef}
                  src={videoSources.frontLeft}
                  className="w-full h-full object-cover"
                  muted
                  onLoadedMetadata={handleVideoLoaded('frontLeft')}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                    Left
                  </span>
                </div>
              </div>
            </div>

            {/* Front Right - Right */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-[434px] h-[240px]">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video h-full">
                <video
                  key={`frontRight-${sessionId}`}
                  ref={frontRightRef}
                  src={videoSources.frontRight}
                  className="w-full h-full object-cover"
                  muted
                  onLoadedMetadata={handleVideoLoaded('frontRight')}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                    Right
                  </span>
                </div>
              </div>
            </div>

            {/* Rear - Bottom */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-[555px] h-[310px]">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video h-full">
                <video
                  key={`rear-${sessionId}`}
                  ref={rearRef}
                  src={videoSources.rear}
                  className="w-full h-full object-cover"
                  muted
                  onLoadedMetadata={handleVideoLoaded('rear')}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                    Rear
                  </span>
                </div>
              </div>
            </div>

            {/* Car Icon - Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {/* <div className="bg-background/95 backdrop-blur-sm p-4 rounded-full border-2 border-primary/30 shadow-xl"> */}
                <img src="/rivian.png" alt="Rivian" className="w-60 h-60" />
              {/* </div> */}
            </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="border-t border-border p-4 bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            className="flex items-center gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <div className="flex-1 relative">
            {/* Seekbar track */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer relative z-10"
            />
            
            {/* Timeline markers */}
            <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
              {markers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full w-1.5 group pointer-events-auto cursor-pointer"
                  style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
                  onClick={() => {
                    const targetTime = (marker.position / 100) * duration;
                    handleSeek(targetTime);
                  }}
                >
                  {/* Marker line with severity-based color - taller for better visibility */}
                  <div 
                    className={`h-full w-1.5 rounded-full transition-all duration-200 group-hover:h-4 group-hover:-translate-y-1 ${
                      marker.severity === 'high' ? 'bg-red-500 shadow-red-500/50' :
                      marker.severity === 'medium' ? 'bg-yellow-500 shadow-yellow-500/50' :
                      'bg-blue-500 shadow-blue-500/50'
                    } group-hover:shadow-lg`}
                  />
                  
                  {/* Enhanced tooltip on hover with arrow */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 group-hover:bottom-10">
                    <div className="relative">
                      {/* Tooltip content */}
                      <div className={`bg-gray-900 border-2 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap ${
                        marker.severity === 'high' ? 'border-red-500' :
                        marker.severity === 'medium' ? 'border-yellow-500' :
                        'border-blue-500'
                      }`}>
                        {/* Violation name */}
                        <div className={`font-bold text-sm mb-1 ${
                          marker.severity === 'high' ? 'text-red-400' :
                          marker.severity === 'medium' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`}>
                          ⚠️ {marker.violationName}
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-gray-300">
                            <span className="font-semibold">Speed:</span>
                            <span>{marker.speed.toFixed(1)} km/h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              marker.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                              marker.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {marker.severity.toUpperCase()} SEVERITY
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            Click to jump to event
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow pointing down */}
                      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-[2px] w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-transparent ${
                        marker.severity === 'high' ? 'border-t-red-500' :
                        marker.severity === 'medium' ? 'border-t-yellow-500' :
                        'border-t-blue-500'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="text-sm text-muted-foreground min-w-fit">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}