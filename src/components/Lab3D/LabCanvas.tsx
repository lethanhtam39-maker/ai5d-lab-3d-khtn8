import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LabSceneManager, TubeStateMap } from './LabScene';
import { ReagentId } from '../../types/lab';
import { TubeFocusOverlay } from './TubeFocusOverlay';
import { soundManager } from '../../services/soundEffects';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  Flame,
  Info,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface LabCanvasProps {
  tubeStates: TubeStateMap;
  selectedReagent: ReagentId | null;
  onSelectReagent: (reagent: ReagentId | null) => void;
  onApplyReagentToTube: (reagent: ReagentId, tubeNum: number) => void;
  onResetTube: (tubeNum: number) => void;
  onResetAll: () => void;
  feedbackMessage: { text: string; type: 'success' | 'warning' | 'error' | 'info' } | null;
}

export const LabCanvas: React.FC<LabCanvasProps> = ({
  tubeStates,
  selectedReagent,
  onSelectReagent,
  onApplyReagentToTube,
  onResetTube,
  onResetAll,
  feedbackMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<LabSceneManager | null>(null);

  const [focusedTube, setFocusedTube] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [hoveredDropTube, setHoveredDropTube] = useState<number | null>(null);
  const [interactionMode, setInteractionMode] = useState<'both' | 'click' | 'drag'>('both');

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new LabSceneManager(containerRef.current);
    sceneManagerRef.current = manager;

    // Handle 3D clicks on tubes or reagents
    manager.onTubeClicked = (tubeNum: number) => {
      if (selectedReagent) {
        // Execute chemical addition
        onApplyReagentToTube(selectedReagent, tubeNum);
        onSelectReagent(null);
      } else {
        // If no chemical selected, zoom to inspect tube
        setFocusedTube(tubeNum);
        manager.setCameraView(tubeNum === 1 ? 'tube1' : tubeNum === 2 ? 'tube2' : 'tube3');
      }
    };

    manager.onReagentClicked = (reagentId: ReagentId) => {
      onSelectReagent(reagentId);
    };

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !sceneManagerRef.current) return;
      sceneManagerRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update physical visual representations whenever tube states change
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateTubeVisuals(tubeStates);
    }
  }, [tubeStates]);

  // Handle Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Handle camera views
  const handleSetView = (view: 'overview' | 'tube1' | 'tube2' | 'tube3') => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraView(view);
      if (view === 'overview') {
        setFocusedTube(null);
      } else if (view === 'tube1') {
        setFocusedTube(1);
      } else if (view === 'tube2') {
        setFocusedTube(2);
      } else if (view === 'tube3') {
        setFocusedTube(3);
      }
    }
  };

  const handleCloseFocus = () => {
    setFocusedTube(null);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraView('overview');
    }
  };

  const handleRotateFocus = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.controls.autoRotate = !sceneManagerRef.current.controls.autoRotate;
      sceneManagerRef.current.controls.autoRotateSpeed = 4.0;
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Reagent drag and drop handlers
  const handleDragStart = (e: React.DragEvent, reagentId: ReagentId) => {
    e.dataTransfer.setData('text/plain', reagentId);
    e.dataTransfer.effectAllowed = 'copyMove';
    onSelectReagent(reagentId);
  };

  const handleDragOver = (e: React.DragEvent, tubeNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (hoveredDropTube !== tubeNum) {
      setHoveredDropTube(tubeNum);
    }
  };

  const handleDragLeave = () => {
    setHoveredDropTube(null);
  };

  const handleDrop = async (e: React.DragEvent, tubeNum: number) => {
    e.preventDefault();
    setHoveredDropTube(null);
    const reagentId = e.dataTransfer.getData('text/plain') as ReagentId;
    if (reagentId) {
      if (sceneManagerRef.current) {
        await sceneManagerRef.current.animateTransfer(reagentId, tubeNum);
      }
      onApplyReagentToTube(reagentId, tubeNum);
      onSelectReagent(null);
    }
  };

  const reagentsList: Array<{ id: ReagentId; name: string; formula: string; color: string; desc: string }> = [
    { id: 'zn', name: 'Kẽm viên', formula: 'Zn', color: 'from-zinc-400 to-zinc-600', desc: 'Kim loại xám bạc' },
    { id: 'hcl', name: 'Axit clohiđric loãng', formula: 'HCl', color: 'from-blue-200 to-blue-400', desc: 'Dung dịch trong suốt' },
    { id: 'bacl2', name: 'Bari clorua', formula: 'BaCl₂', color: 'from-slate-200 to-slate-400', desc: 'Dung dịch không màu' },
    { id: 'cuso4', name: 'Đồng(II) sunfat', formula: 'CuSO₄', color: 'from-sky-500 to-blue-600', desc: 'Dung dịch xanh lam' },
    { id: 'naoh', name: 'Natri hiđroxit', formula: 'NaOH', color: 'from-emerald-300 to-teal-500', desc: 'Ống nhỏ giọt kiềm' },
  ];

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-950 flex flex-col select-none overflow-hidden rounded-xl border border-slate-800">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: View presets */}
        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/70 shadow-lg pointer-events-auto">
          <button
            onClick={() => handleSetView('overview')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              focusedTube === null
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Toàn cảnh
          </button>
          <button
            onClick={() => handleSetView('tube1')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              focusedTube === 1
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ống (1): Zn+HCl
          </button>
          <button
            onClick={() => handleSetView('tube2')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              focusedTube === 2
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ống (2): BaCl₂+HCl
          </button>
          <button
            onClick={() => handleSetView('tube3')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              focusedTube === 3
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ống (3): Cu+NaOH
          </button>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/70 shadow-lg pointer-events-auto">
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isMuted ? 'text-red-400 bg-red-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isMuted ? 'Bật âm thanh thí nghiệm' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onResetAll}
            className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors text-xs"
            title="Làm lại toàn bộ thí nghiệm (dọn sạch 3 ống)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình phòng lab'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 relative cursor-grab active:cursor-grabbing outline-none"
      />

      {/* 3D Focus Observation Overlay */}
      {focusedTube !== null && (
        <TubeFocusOverlay
          tubeNum={focusedTube}
          contents={tubeStates[focusedTube]}
          onClose={handleCloseFocus}
          onRotateView={handleRotateFocus}
        />
      )}

      {/* Floating Target Drop Zones overlay over 3D racks (helps touch / drag targeting) */}
      <div className="absolute top-[32%] left-[18%] right-[18%] h-44 pointer-events-none grid grid-cols-3 gap-6">
        {[1, 2, 3].map((tubeNum) => {
          const isTargeted = hoveredDropTube === tubeNum || (selectedReagent && true);
          return (
            <div
              key={tubeNum}
              onDragOver={(e) => handleDragOver(e, tubeNum)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tubeNum)}
              onClick={() => {
                if (selectedReagent) {
                  onApplyReagentToTube(selectedReagent, tubeNum);
                  onSelectReagent(null);
                } else {
                  setFocusedTube(tubeNum);
                  handleSetView(tubeNum === 1 ? 'tube1' : tubeNum === 2 ? 'tube2' : 'tube3');
                }
              }}
              className={`rounded-2xl border-2 transition-all duration-200 pointer-events-auto cursor-pointer flex flex-col justify-end p-2 ${
                hoveredDropTube === tubeNum
                  ? 'border-blue-400 bg-blue-500/20 scale-105 shadow-xl shadow-blue-500/20'
                  : selectedReagent
                  ? 'border-dashed border-sky-400/50 bg-sky-500/5 hover:border-sky-300 hover:bg-sky-500/15'
                  : 'border-transparent hover:border-slate-700/50 hover:bg-slate-800/10'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-700/60 shadow">
                <span>Ống ({tubeNum})</span>
                <span className="text-sky-400 flex items-center gap-0.5">
                  <ZoomIn className="w-3 h-3" /> Xem
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Interactive Chemical Selection Shelf (Dual Drag & Drop + Click-to-Transfer) */}
      <div className="p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="font-bold text-white tracking-wide uppercase text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Kệ Hóa chất 3D
            </span>
            <span className="text-slate-400 hidden sm:inline">
              • Chọn cách thao tác: <strong>Kéo thả</strong> vào ống nghiệm HOẶC <strong>Chạm chọn</strong> rồi chạm ống
            </span>
          </div>

          {selectedReagent && (
            <button
              onClick={() => onSelectReagent(null)}
              className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
            >
              Hủy chọn (Đang chọn: {selectedReagent.toUpperCase()})
            </button>
          )}
        </div>

        {/* Chemical Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {reagentsList.map((reagent) => {
            const isSelected = selectedReagent === reagent.id;
            return (
              <div
                key={reagent.id}
                draggable
                onDragStart={(e) => handleDragStart(e, reagent.id)}
                onClick={() => {
                  onSelectReagent(isSelected ? null : reagent.id);
                }}
                className={`group relative p-2 rounded-xl border text-left cursor-pointer transition-all duration-150 select-none ${
                  isSelected
                    ? 'border-blue-400 bg-blue-900/40 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-400 tracking-wider">
                      {reagent.formula}
                    </span>
                    <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {reagent.name}
                    </p>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${reagent.color} shadow-sm border border-white/20`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>{reagent.desc}</span>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Kéo / Chạm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating feedback notification banner */}
      {feedbackMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] pointer-events-none animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-medium pointer-events-auto ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : feedbackMessage.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : feedbackMessage.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
            }`}
          >
            {feedbackMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {feedbackMessage.type === 'warning' && <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {feedbackMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            <span className="flex-1 leading-snug">{feedbackMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
