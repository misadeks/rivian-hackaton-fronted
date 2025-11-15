export interface DrivingSession {
  id: string;
  start_time: string;
  end_time: string;
}

export interface TimelineEvent {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  limit: number;
  detected_violation: string | null;
}

export interface DriveData {
  id: string;
  start_time: string;
  end_time: string;
  score: number;
  timeline: TimelineEvent[];
}

export interface VideoAngles {
  frontCenter: string;
  frontLeft: string;
  frontRight: string;
  rear: string;
}

export type FocusedCamera = 'frontCenter' | 'frontLeft' | 'frontRight' | 'rear' | null;

export interface ViolationType {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  color: string;
}