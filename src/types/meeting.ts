export interface Participant {
  id: string;
  name: string;
  color: string;
  initial: string;
  isLocal: boolean;
}

export interface Caption {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface Explanation {
  id: string;
  captionId: string;
  text: string;
}

export interface MockScript {
  speakerId: string;
  text: string;
  explanation: string;
}
