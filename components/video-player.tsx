'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Focus, Car, ArrowLeft } from 'lucide-react';
import { FocusedCamera, VideoAngles } from '@/types/driving';

interface VideoPlayerProps {
  sessionId: string | null;
  focusedCamera: FocusedCamera;
  onCameraFocus: (camera: FocusedCamera) => void;
}

interface CameraConfig {
  key: FocusedCamera;
  label: string;
}

const CAMERAS: CameraConfig[] = [
  { key: 'frontLeft', label: 'Front Left' },
  { key: 'frontCenter', label: 'Front Center' },
  { key: 'frontRight', label: 'Front Right' },
  { key: 'rear', label: 'Rear' }
];

export function VideoPlayer({ sessionId, focusedCamera, onCameraFocus }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRefs = {
    frontCenter: useRef<HTMLVideoElement>(null),
    frontLeft: useRef<HTMLVideoElement>(null),
    frontRight: useRef<HTMLVideoElement>(null),
    rear: useRef<HTMLVideoElement>(null),
  };

//   const getVideoSources = (sessionId: string): VideoAngles => ({
//     frontCenter: `/videos/session-${sessionId}/front-center.mp4`,
//     frontLeft: `/videos/session-${sessionId}/front-left.mp4`, 
//     frontRight: `/videos/session-${sessionId}/front-right.mp4`,
//     rear: `/videos/session-${sessionId}/rear.mp4`,
//   });

  const getVideoSources = (sessionId: string): VideoAngles => ({
    frontCenter: `Rivian Dash Cam - Long Drive Session/1/11_13_25_131815_frontCenter_001.mp4`,
    frontLeft: `Rivian Dash Cam - Long Drive Session/1/11_13_25_131815_sideLeft_001.mp4`, 
    frontRight: `Rivian Dash Cam - Long Drive Session/1/11_13_25_131815_sideRight_001.mp4`,
    rear: `Rivian Dash Cam - Long Drive Session/1/11_13_25_131815_rearCenter_001.mp4`,
  });

  const syncVideos = (action: 'play' | 'pause' | 'seek', time?: number) => {
    Object.values(videoRefs).forEach(ref => {
      if (!ref.current) return;
      
      switch (action) {
        case 'play':
          ref.current.play();
          break;
        case 'pause':
          ref.current.pause();
          break;
        case 'seek':
          if (time !== undefined) ref.current.currentTime = time;
          break;
      }
    });
  };

  const togglePlayback = () => {
    syncVideos(isPlaying ? 'pause' : 'play');
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    syncVideos('seek', time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Component for individual video
  const VideoCard = ({ cameraKey, label }: { cameraKey: keyof typeof videoRefs; label: string }) => {
    if (!cameraKey) return null;
    
    return (
      <div className="relative bg-black rounded-lg overflow-hidden group cursor-pointer aspect-video"
           onClick={() => onCameraFocus(cameraKey)}>
        <video
          ref={videoRefs[cameraKey]}
          src={sessionId ? getVideoSources(sessionId)[cameraKey] : ''}
          className="w-full h-full object-cover"
          muted
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="absolute top-3 left-3">
            <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
              {label}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-black">
              <Focus className="w-4 h-4 mr-2" />
              Focus
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
        {focusedCamera ? (
          // Single focused video
          <div className="h-full relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRefs[focusedCamera]}
              src={videoSources[focusedCamera]}
              className="w-full h-full object-cover"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            
            <div className="absolute top-4 left-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCameraFocus(null)}
                className="bg-black/50 hover:bg-black/70 text-white border-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Grid
              </Button>
            </div>
            
            <div className="absolute top-4 right-4">
              <span className="bg-black/50 px-3 py-2 rounded text-white text-sm font-medium">
                {CAMERAS.find(c => c.key === focusedCamera)?.label}
              </span>
            </div>
          </div>
        ) : (
          // Cross pattern layout with maximum space utilization
          <div className="h-full w-full relative">
            {/* Front Center - Top (Large) */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-[520px] h-[290px]">
              <VideoCard cameraKey="frontCenter" label="Front Center" />
            </div>

            {/* Front Left - Left (Medium-Large) */}
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-[380px] h-[210px]">
              <VideoCard cameraKey="frontLeft" label="Front Left" />
            </div>

            {/* Front Right - Right (Medium-Large) */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-[380px] h-[210px]">
              <VideoCard cameraKey="frontRight" label="Front Right" />
            </div>

            {/* Rear - Bottom (Large) */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-[520px] h-[290px]">
              <VideoCard cameraKey="rear" label="Rear" />
            </div>

            {/* Car Icon - Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-background/95 backdrop-blur-sm p-4 rounded-full border-2 border-primary/30 shadow-xl">
                <Car className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
        )}
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
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <span className="text-sm text-muted-foreground min-w-fit">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <Button variant="outline" size="sm">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}