export interface MeshFile {
  id: string;
  name: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'ZIP' | 'TXT';
  size: string;
  peers: number;
  status: 'offline' | 'remote' | 'transferring' | 'available';
  category: 'document' | 'video' | 'raw_data' | 'audio';
  progress?: number;
  speed?: string;
  eta?: string;
  coverUrl?: string;
  description?: string;
  downloadCount?: number;
}

export interface ActiveTransfer {
  id: string;
  fileId: string;
  name: string;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'ZIP' | 'TXT';
  direction: 'incoming' | 'outgoing';
  progress: number;
  speed: string;
  eta: string;
  peerName: string;
  sizeLeft: string;
}

export interface PeerNode {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'relay';
  signalStrength: number; // 1-4 bars
  latencyMs: number;
  isLocal: boolean;
  sharedFilesCount: number;
}

export interface SystemMetrics {
  transmissionRate: number; // MB/s
  networkHealth: number; // percentage
  peersCount: number;
  syncPercent: number;
}
