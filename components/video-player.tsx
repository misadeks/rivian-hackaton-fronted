'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Maximize, Focus, Car } from 'lucide-react';
import { FocusedCamera, VideoAngles } from '@/types/driving';

interface VideoPlayerProps {
  sessionId: string | null;
  focusedCamera: FocusedCamera;
  onCameraFocus: (camera: FocusedCamera) => void;
}

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

  // Mock video sources - replace with actual video paths
  const getVideoSources = (sessionId: string): VideoAngles => ({
    frontCenter: `/videos/session-${sessionId}/front-center.mp4`,
    frontLeft: `/videos/session-${sessionId}/front-left.mp4`, 
    frontRight: `/videos/session-${sessionId}/front-right.mp4`,
    rear: `/videos/session-${sessionId}/rear.mp4`,
  });

  const syncVideos = (action: 'play' | 'pause' | 'seek', time?: number) => {
    Object.values(videoRefs).forEach(ref => {
      if (ref.current) {
        if (action === 'play') {
          ref.current.play();
        } else if (action === 'pause') {
          ref.current.pause();
        } else if (action === 'seek' && time !== undefined) {
          ref.current.currentTime = time;
        }
      }
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      syncVideos('pause');
    } else {
      syncVideos('play');
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    syncVideos('seek', time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cameras = [
    { key: 'frontLeft' as const, label: 'Front Left', position: 'top-left' },
    { key: 'frontCenter' as const, label: 'Front Center', position: 'top-center' },
    { key: 'frontRight' as const, label: 'Front Right', position: 'top-right' },
    { key: 'rear' as const, label: 'Rear', position: 'bottom-center' },
  ];

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
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
      <div className="flex-1 p-6">
        <div className="h-full relative">
          {focusedCamera ? (
            // Focused single video view
            <Card className="h-full p-4">
              <div className="h-full relative rounded-lg overflow-hidden bg-black">
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
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <Maximize className="w-4 h-4 mr-2" />
                    Exit Focus
                  </Button>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 px-3 py-1 rounded text-white text-sm">
                    {cameras.find(c => c.key === focusedCamera)?.label}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            // Multi-camera grid view with Rivian car in center
            <div className="h-full flex flex-col justify-end">
              {/* Top row - Front cameras */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Front Left */}
                <Card className="p-3 aspect-video">
                  <div className="relative h-full rounded-lg overflow-hidden bg-black group cursor-pointer"
                       onClick={() => onCameraFocus('frontLeft')}>
                    <video
                      ref={videoRefs.frontLeft}
                      src={videoSources.frontLeft}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                          Front Left
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
                </Card>

                {/* Front Center */}
                <Card className="p-3 aspect-video">
                  <div className="relative h-full rounded-lg overflow-hidden bg-black group cursor-pointer"
                       onClick={() => onCameraFocus('frontCenter')}>
                    <video
                      ref={videoRefs.frontCenter}
                      src={videoSources.frontCenter}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                          Front Center
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
                </Card>

                {/* Front Right */}
                <Card className="p-3 aspect-video">
                  <div className="relative h-full rounded-lg overflow-hidden bg-black group cursor-pointer"
                       onClick={() => onCameraFocus('frontRight')}>
                    <video
                      ref={videoRefs.frontRight}
                      src={videoSources.frontRight}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                          Front Right
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
                </Card>
              </div>

              {/* Middle section with Rivian car icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="bg-primary/10 p-4 rounded-full border-2 border-primary/20">
                  <Car className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Bottom row - Rear camera */}
              <div className="grid grid-cols-3 gap-6">
                <div></div> {/* Empty space */}
                <Card className="p-3 aspect-video">
                  <div className="relative h-full rounded-lg overflow-hidden bg-black group cursor-pointer"
                       onClick={() => onCameraFocus('rear')}>
                    <video
                      ref={videoRefs.rear}
                      src={videoSources.rear}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 px-3 py-1 rounded text-white text-sm font-medium">
                          Rear
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
                </Card>
                <div></div> {/* Empty space */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Controls */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleTimeUpdate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <Button variant="outline" size="sm">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}