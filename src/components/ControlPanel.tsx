import React from 'react';
import type { FlockConfig } from '../types/boid';
import type { ToidConfig } from '../types/toid';
import type { FoidConfig } from '../types/foid';
import type { LoidConfig } from '../types/loid';
import type { WorldConfig } from '../types/world';

interface Props {
  boidConfig: FlockConfig;
  onBoidChange: (updates: Partial<FlockConfig>) => void;
  toidConfig: ToidConfig;
  onToidChange: (updates: Partial<ToidConfig>) => void;
  foidConfig: FoidConfig;
  onFoidChange: (updates: Partial<FoidConfig>) => void;
  worldConfig: WorldConfig;
  onWorldChange: (updates: Partial<WorldConfig>) => void;
  isOpen: boolean;
  onToggle: () => void;
  isRunning: boolean;
  onStart: () => void;
  onReset: () => void;
  onAddBoid: () => void;
  onAddToid: () => void;
  onAddFoid: () => void;
  onAddLoid: () => void;
  loidConfig: LoidConfig;
  onLoidChange: (updates: Partial<LoidConfig>) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, accent = '#7eb8f7', onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, opacity: 0.85 }}>
        <span>{label}</span>
        <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
          {step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: accent }}
      />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ label, color, action }: { label: string; color?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 14px' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, color: color ?? 'white' }}>
        {label}
      </p>
      {action}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '20px 0' }} />;
}

const PANEL_WIDTH = 272;

export function ControlPanel({
  boidConfig, onBoidChange,
  toidConfig, onToidChange,
  foidConfig, onFoidChange,
  worldConfig, onWorldChange,
  isOpen, onToggle,
  isRunning, onStart, onReset,
  onAddBoid, onAddToid, onAddFoid, onAddLoid,
  loidConfig, onLoidChange,
}: Props) {
  return (
    <>
      <button
        onClick={onToggle}
        aria-label="Toggle settings"
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? PANEL_WIDTH : 0,
          transform: 'translateY(-50%)',
          transition: 'right 0.32s cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(8,8,24,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRight: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: '8px 0 0 8px',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '10px 8px',
          fontSize: 16,
          lineHeight: 1,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 101,
        }}
      >
        {isOpen ? '›' : '‹'}
      </button>

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(6,6,20,0.94)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          color: 'white',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', opacity: 0.7 }}>
            Simulation Settings
          </p>
        </div>

        {isRunning && (
          <div style={{
            margin: '14px 20px 0',
            padding: '8px 12px',
            background: 'rgba(255,180,60,0.07)',
            border: '1px solid rgba(255,180,60,0.2)',
            borderRadius: 6,
            fontSize: 11,
            color: 'rgba(255,180,60,0.65)',
            lineHeight: 1.5,
          }}>
            Count changes take effect on next Start
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
          <SectionLabel label="World" />
          <Slider label="Energy Transfer" value={worldConfig.energyTransfer} min={0} max={1} step={0.05} onChange={v => onWorldChange({ energyTransfer: v })} />

          <Divider />

          <SectionLabel label="Boids" action={isRunning && <AddButton onClick={onAddBoid} label="+5" />} />
          <Slider label="Count"              value={boidConfig.count}            min={10}   max={300}  step={1}    onChange={v => onBoidChange({ count: v })} />
          <Slider label="Linear Velocity"    value={boidConfig.speed}            min={0.5}  max={10}   step={0.5}  onChange={v => onBoidChange({ speed: v })} />
          <Slider label="Angular Velocity"   value={boidConfig.angularVelocity}  min={0}    max={0.2}  step={0.01} onChange={v => onBoidChange({ angularVelocity: v })} />
          <Slider label="Perception Radius"  value={boidConfig.perceptionRadius} min={20}   max={200}  step={5}    onChange={v => onBoidChange({ perceptionRadius: v })} />
          <Slider label="Max Force"          value={boidConfig.maxForce}         min={0.01} max={0.5}  step={0.01} onChange={v => onBoidChange({ maxForce: v })} />
          <Slider label="Separation"         value={boidConfig.separation}       min={0}    max={5}    step={0.1}  onChange={v => onBoidChange({ separation: v })} />
          <Slider label="Alignment"          value={boidConfig.alignment}        min={0}    max={5}    step={0.1}  onChange={v => onBoidChange({ alignment: v })} />
          <Slider label="Cohesion"           value={boidConfig.cohesion}         min={0}    max={5}    step={0.1}  onChange={v => onBoidChange({ cohesion: v })} />
          <Slider label="Prey Attraction"    value={boidConfig.foidAttraction}   min={0}    max={5}    step={0.1}  onChange={v => onBoidChange({ foidAttraction: v })} />
          <Slider label="Predator Repulsion" value={boidConfig.toidRepulsion}    min={0}    max={5}    step={0.1}  onChange={v => onBoidChange({ toidRepulsion: v })} />
          <Slider label="Eat Proclivity %" value={boidConfig.eatProclivityPct} min={0} max={100} step={5} onChange={v => onBoidChange({ eatProclivityPct: v })} />
          <Slider label="Lifespan (s)" value={boidConfig.lifespanSecs} min={30} max={600} step={10} onChange={v => onBoidChange({ lifespanSecs: v })} />
          <Slider label="Mitosis Proclivity %" value={boidConfig.mitosisProclivityPct} min={0} max={100} step={5} accent="#c084fc" onChange={v => onBoidChange({ mitosisProclivityPct: v })} />
          <Slider label="Mitosis Cost %"       value={boidConfig.mitosisCostPct}       min={0} max={100} step={5} accent="#c084fc" onChange={v => onBoidChange({ mitosisCostPct: v })} />

          <Divider />

          <SectionLabel label="Toids" color="#ffb43c" action={isRunning && <AddButton onClick={onAddToid} label="+1" />} />
          <Slider label="Count"              value={toidConfig.count}           min={0}   max={20}  step={1}    accent="#ffb43c" onChange={v => onToidChange({ count: v })} />
          <Slider label="Linear Velocity"    value={toidConfig.speed}           min={0.5} max={10}  step={0.5}  accent="#ffb43c" onChange={v => onToidChange({ speed: v })} />
          <Slider label="Angular Velocity"   value={toidConfig.angularVelocity} min={0}   max={0.2} step={0.01} accent="#ffb43c" onChange={v => onToidChange({ angularVelocity: v })} />
          <Slider label="Hunting Strategy"   value={toidConfig.huntingStrategy} min={-5}  max={5}   step={0.1}  accent="#ffb43c" onChange={v => onToidChange({ huntingStrategy: v })} />
          <Slider label="Eat Proclivity %" value={toidConfig.eatProclivityPct} min={0} max={100} step={5} accent="#ffb43c" onChange={v => onToidChange({ eatProclivityPct: v })} />
          <Slider label="Lifespan (s)" value={toidConfig.lifespanSecs} min={30} max={600} step={10} accent="#ffb43c" onChange={v => onToidChange({ lifespanSecs: v })} />
          <Slider label="Mitosis Proclivity %" value={toidConfig.mitosisProclivityPct} min={0} max={100} step={5} accent="#c084fc" onChange={v => onToidChange({ mitosisProclivityPct: v })} />
          <Slider label="Mitosis Cost %"       value={toidConfig.mitosisCostPct}       min={0} max={100} step={5} accent="#c084fc" onChange={v => onToidChange({ mitosisCostPct: v })} />

          <Divider />

          <SectionLabel label="Foids" color="#50c864" action={isRunning && <AddButton onClick={onAddFoid} label="+5" />} />
          <Slider label="Max Count"   value={foidConfig.maxCount}  min={0}   max={300} step={5}   accent="#50c864" onChange={v => onFoidChange({ maxCount: v })} />
          <Slider label="Spawn Rate"  value={foidConfig.spawnRate} min={0}   max={20}  step={0.5} accent="#50c864" onChange={v => onFoidChange({ spawnRate: v })} />
          <Slider label="Mitosis Proclivity %" value={foidConfig.mitosisProclivityPct} min={0} max={100} step={5} accent="#c084fc" onChange={v => onFoidChange({ mitosisProclivityPct: v })} />
          <Slider label="Mitosis Cost %"       value={foidConfig.mitosisCostPct}       min={0} max={100} step={5} accent="#c084fc" onChange={v => onFoidChange({ mitosisCostPct: v })} />

          <Divider />

          <SectionLabel label="Loids" color="#e03244" action={isRunning && <AddButton onClick={onAddLoid} label="+5" />} />
          <Slider label="Count"              value={loidConfig.count}             min={0}   max={100} step={1}    accent="#e03244" onChange={v => onLoidChange({ count: v })} />
          <Slider label="Linear Velocity"    value={loidConfig.speed}             min={0.5} max={10}  step={0.5}  accent="#e03244" onChange={v => onLoidChange({ speed: v })} />
          <Slider label="Angular Velocity"   value={loidConfig.angularVelocity}   min={0}   max={0.2} step={0.01} accent="#e03244" onChange={v => onLoidChange({ angularVelocity: v })} />
          <Slider label="Prey Attraction"    value={loidConfig.foidAttraction}    min={0}   max={5}   step={0.1}  accent="#e03244" onChange={v => onLoidChange({ foidAttraction: v })} />
          <Slider label="Predator Repulsion" value={loidConfig.predatorRepulsion} min={0}   max={5}   step={0.1}  accent="#e03244" onChange={v => onLoidChange({ predatorRepulsion: v })} />
          <Slider label="Eat Proclivity %" value={loidConfig.eatProclivityPct} min={0} max={100} step={5} accent="#e03244" onChange={v => onLoidChange({ eatProclivityPct: v })} />
          <Slider label="Lifespan (s)" value={loidConfig.lifespanSecs} min={30} max={600} step={10} accent="#e03244" onChange={v => onLoidChange({ lifespanSecs: v })} />
          <Slider label="Mitosis Proclivity %" value={loidConfig.mitosisProclivityPct} min={0} max={100} step={5}  accent="#c084fc" onChange={v => onLoidChange({ mitosisProclivityPct: v })} />
          <Slider label="Mitosis Cost %"       value={loidConfig.mitosisCostPct}       min={0} max={100} step={5}  accent="#c084fc" onChange={v => onLoidChange({ mitosisCostPct: v })} />
        </div>

        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {isRunning ? (
            <button
              onClick={onReset}
              style={{
                width: '100%', padding: '10px',
                background: 'rgba(255,80,80,0.15)',
                border: '1px solid rgba(255,80,80,0.35)',
                borderRadius: 8,
                color: 'rgba(255,120,120,0.9)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              Reset
            </button>
          ) : (
            <button
              onClick={onStart}
              style={{
                width: '100%', padding: '10px',
                background: 'rgba(100,200,120,0.15)',
                border: '1px solid rgba(100,200,120,0.35)',
                borderRadius: 8,
                color: 'rgba(140,230,150,0.9)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              Start
            </button>
          )}
        </div>
      </div>
    </>
  );
}
