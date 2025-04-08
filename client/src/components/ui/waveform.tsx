import React from "react";

interface WaveformProps {
  isPlaying: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isPlaying }) => {
  return (
    <div className="mb-4 rounded-md overflow-hidden bg-neutral-100 p-2">
      <div 
        className={`h-[60px] w-full bg-gradient-to-b from-primary to-primary-light
                   mask-waveform mask-size-1200-60 ${isPlaying ? 'animate-move-waveform' : ''}`}
      ></div>
      <style jsx>{`
        @keyframes move-waveform {
          from { mask-position: 0px 0px; }
          to { mask-position: 1200px 0px; }
        }
        
        .mask-waveform {
          mask: url("data:image/svg+xml;utf8,<svg viewBox='0 0 1200 60' xmlns='http://www.w3.org/2000/svg'><path d='M0,30 Q300,5 600,30 T1200,30' fill='black'/></svg>") repeat-x;
        }
        
        .mask-size-1200-60 {
          mask-size: 1200px 60px;
        }
        
        .animate-move-waveform {
          animation: move-waveform 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Waveform;
