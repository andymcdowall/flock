import React, { useEffect, useState } from 'react';

const MIN_SPEED = 0.25;
const MAX_SPEED = 64;

interface Props {
  isPaused: boolean;
  onTogglePause: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  onSpeedDown: () => void;
  onSpeedUp: () => void;
  elapsed: number;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function clampSpeed(v: number): number {
  return Math.max(MIN_SPEED, Math.min(MAX_SPEED, v));
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 14,
        lineHeight: 1,
        padding: '4px 8px',
        borderRadius: 6,
        transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function SpeedInput({ speed, onChange }: { speed: number; onChange: (v: number) => void }) {
  const [val, setVal] = useState(String(speed));

  useEffect(() => {
    setVal(String(speed));
  }, [speed]);

  const commit = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v) && v > 0) {
      onChange(clampSpeed(v));
    } else {
      setVal(String(speed));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => commit(val)}
      onKeyDown={e => {
        if (e.key === 'Enter') { commit(val); e.currentTarget.blur(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); onChange(clampSpeed(speed + 1)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clampSpeed(speed - 1)); }
      }}
      style={{
        width: 36,
        background: 'none',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        fontVariantNumeric: 'tabular-nums',
        outline: 'none',
        cursor: 'text',
        padding: '1px 0',
      }}
    />
  );
}

export function SimControls({ isPaused, onTogglePause, speed, onSpeedChange, onSpeedDown, onSpeedUp, elapsed }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(6,6,20,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '6px 12px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: 'white',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      <span style={{
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
        opacity: isPaused ? 0.35 : 0.7,
        minWidth: 40,
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        {formatTime(elapsed)}
      </span>

      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />

      <Btn onClick={onSpeedDown} disabled={speed <= MIN_SPEED}>«</Btn>
      <SpeedInput speed={speed} onChange={onSpeedChange} />
      <span style={{ fontSize: 12, opacity: 0.4, marginLeft: 1 }}>×</span>
      <Btn onClick={onSpeedUp} disabled={speed >= MAX_SPEED}>»</Btn>

      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />

      <Btn onClick={onTogglePause}>{isPaused ? '▶' : '⏸'}</Btn>
    </div>
  );
}
