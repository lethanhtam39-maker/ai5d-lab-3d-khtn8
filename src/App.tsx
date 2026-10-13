import React, { useState, useEffect } from 'react';
import { LabCanvas } from './components/Lab3D/LabCanvas';
import { SidebarGuide } from './components/SidebarGuide/SidebarGuide';
import { WorksheetPanel } from './components/Worksheet/WorksheetPanel';
import { ReagentId, TubeContents, ActionLogItem, WorksheetData } from './types/lab';
import { TubeStateMap } from './components/Lab3D/LabScene';
import { soundManager } from './services/soundEffects';
import {
  FlaskConical,
  BookOpen,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const INITIAL_TUBES: TubeStateMap = {
  1: {
    reagents: [],
    liquidVolume: 0,
    liquidColor: '#93c5fd',
    liquidOpacity: 0.2,
    hasZn: false,
    znRemainingPercent: 100,
    isReacting: false,
    reactionType: 'none',
    precipitateAmount: 0,
    precipitateColor: '#38bdf8',
    bubblesCount: 0,
    stageName: 'Ống sạch',
    scientificNote: 'Chưa có chất',
  },
  2: {
    reagents: [],
    liquidVolume: 0,
    liquidColor: '#ffffff',
    liquidOpacity: 0.15,
    hasZn: false,
    znRemainingPercent: 100,
    isReacting: false,
    reactionType: 'none',
    precipitateAmount: 0,
    precipitateColor: '#ffffff',
    bubblesCount: 0,
    stageName: 'Ống sạch',
    scientificNote: 'Chưa có chất',
  },
  3: {
    reagents: [],
    liquidVolume: 0,
    liquidColor: '#0284c7',
    liquidOpacity: 0.85,
    hasZn: false,
    znRemainingPercent: 100,
    isReacting: false,
    reactionType: 'none',
    precipitateAmount: 0,
    precipitateColor: '#38bdf8',
    bubblesCount: 0,
    stageName: 'Ống sạch',
    scientificNote: 'Chưa có chất',
  },
};

export default function App() {
  const [tubeStates, setTubeStates] = useState<TubeStateMap>(INITIAL_TUBES);
  const [selectedReagent, setSelectedReagent] = useState<ReagentId | null>(null);
  const [completedExperiments, setCompletedExperiments] = useState<Set<number>>(new Set());
  const [activeExpTab, setActiveExpTab] = useState<number>(1);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'guide' | 'lab' | 'worksheet'>('lab');

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>({
    text: 'Chào mừng em đến với AI–5Đ Lab 3D! Hãy chọn hóa chất và cho vào ống nghiệm tương ứng.',
    type: 'info',
  });

  // Student worksheet state
  const [worksheetData, setWorksheetData] = useState<WorksheetData>({
    studentName: '',
    studentClass: '',
    q1_prediction: '',
    q2_tube1_phenomenon: '',
    q3_tube2_phenomenon: '',
    q4_tube3_phenomenon: '',
    q5_reaction_identification: '',
    q6_chemical_equations: '',
    q7_ai_critique: '',
    isSubmitted: false,
    submittedAt: null,
  });

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Zn shrinkage interval when reacting
  useEffect(() => {
    if (tubeStates[1].isReacting) {
      const shrinkTimer = setInterval(() => {
        setTubeStates((prev) => {
          const current = prev[1];
          if (!current || current.znRemainingPercent <= 40) return prev;
          return {
            ...prev,
            1: {
              ...current,
              znRemainingPercent: Math.max(35, current.znRemainingPercent - 1.5),
            },
          };
        });
      }, 800);
      return () => clearInterval(shrinkTimer);
    }
  }, [tubeStates[1]?.isReacting]);

  const addLog = (action: string, type: 'success' | 'warning' | 'error' | 'info', tubeNumber?: number) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}:${
      now.getSeconds() < 10 ? '0' : ''
    }${now.getSeconds()}`;
    setActionLogs((prev) => [{ id: Math.random().toString(), timestamp: timeStr, action, type, tubeNumber }, ...prev]);
  };

  const showNotification = (text: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback((curr) => (curr?.text === text ? null : curr));
    }, 5500);
  };

  // Chemical handling logic
  const handleApplyReagentToTube = (reagent: ReagentId, tubeNum: number) => {
    // 1. TUBE 1: Kẽm (Zn) + HCl loãng
    if (tubeNum === 1) {
      if (reagent === 'zn') {
        if (tubeStates[1].hasZn) {
          showNotification('Ống nghiệm (1) đã có viên kẽm Zn rồi!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          1: {
            ...prev[1],
            hasZn: true,
            reagents: Array.from(new Set([...prev[1].reagents, 'zn'])),
            stageName: 'Đã có viên Zn',
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Cho viên Zn vào ống nghiệm (1)', 'success', 1);

        if (tubeStates[1].reagents.includes('hcl')) {
          // Both are present now!
          startTube1Reaction();
        } else {
          showNotification('Đã cho viên kẽm Zn vào ống (1). Tiếp theo hãy rót 3 mL axit HCl loãng vào.', 'info');
        }
        return;
      }

      if (reagent === 'hcl') {
        if (tubeStates[1].reagents.includes('hcl')) {
          showNotification('Ống nghiệm (1) đã có dung dịch axit HCl loãng!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          1: {
            ...prev[1],
            liquidVolume: 50,
            liquidColor: '#93c5fd',
            liquidOpacity: 0.2,
            reagents: Array.from(new Set([...prev[1].reagents, 'hcl'])),
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Rót dung dịch HCl loãng vào ống nghiệm (1)', 'success', 1);

        if (tubeStates[1].hasZn) {
          startTube1Reaction();
        } else {
          showNotification('Đã rót axit HCl vào ống (1). Hãy cho thêm viên Zn vào để quan sát phản ứng!', 'info');
        }
        return;
      }

      // Wrong reagent for Tube 1
      setErrorCount((e) => e + 1);
      soundManager.playWarning();
      addLog(`Thao tác chưa phù hợp: Cho ${reagent.toUpperCase()} vào ống (1)`, 'warning', 1);
      showNotification(
        `Lưu ý: Ống (1) là thí nghiệm Kẽm (Zn) tác dụng với HCl loãng. Hóa chất ${reagent.toUpperCase()} không phù hợp cho ống này.`,
        'warning'
      );
      return;
    }

    // 2. TUBE 2: BaCl2 + HCl
    if (tubeNum === 2) {
      if (reagent === 'bacl2') {
        if (tubeStates[2].reagents.includes('bacl2')) {
          showNotification('Ống nghiệm (2) đã có dung dịch BaCl₂ rồi!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          2: {
            ...prev[2],
            liquidVolume: prev[2].liquidVolume + 35,
            liquidColor: '#ffffff',
            liquidOpacity: 0.15,
            reagents: Array.from(new Set([...prev[2].reagents, 'bacl2'])),
            stageName: 'Có BaCl₂',
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Cho dung dịch BaCl₂ vào ống nghiệm (2)', 'success', 2);

        if (tubeStates[2].reagents.includes('hcl')) {
          completeTube2Observation();
        } else {
          showNotification('Đã cho 2 mL dung dịch BaCl₂. Tiếp tục thêm 3 mL dung dịch HCl loãng.', 'info');
        }
        return;
      }

      if (reagent === 'hcl') {
        if (tubeStates[2].reagents.includes('hcl')) {
          showNotification('Ống nghiệm (2) đã có dung dịch HCl rồi!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          2: {
            ...prev[2],
            liquidVolume: prev[2].liquidVolume + 35,
            liquidColor: '#ffffff',
            liquidOpacity: 0.15,
            reagents: Array.from(new Set([...prev[2].reagents, 'hcl'])),
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Thêm dung dịch HCl vào ống nghiệm (2)', 'success', 2);

        if (tubeStates[2].reagents.includes('bacl2')) {
          completeTube2Observation();
        } else {
          showNotification('Đã thêm dung dịch HCl vào ống (2). Tiếp theo hãy thêm dung dịch BaCl₂.', 'info');
        }
        return;
      }

      // Wrong reagent for Tube 2
      setErrorCount((e) => e + 1);
      soundManager.playWarning();
      addLog(`Thao tác chưa phù hợp: Cho ${reagent.toUpperCase()} vào ống (2)`, 'warning', 2);
      showNotification(
        `Lưu ý: Ống (2) là thí nghiệm giữa BaCl₂ và HCl loãng. Hãy thêm đúng hóa chất yêu cầu.`,
        'warning'
      );
      return;
    }

    // 3. TUBE 3: CuSO4 + NaOH
    if (tubeNum === 3) {
      if (reagent === 'cuso4') {
        if (tubeStates[3].reagents.includes('cuso4')) {
          showNotification('Ống nghiệm (3) đã có dung dịch CuSO₄ rồi!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          3: {
            ...prev[3],
            liquidVolume: 40,
            liquidColor: '#0284c7', // Sky royal blue
            liquidOpacity: 0.85,
            reagents: Array.from(new Set([...prev[3].reagents, 'cuso4'])),
            stageName: 'Có CuSO₄ xanh lam',
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Cho dung dịch CuSO₄ màu xanh lam vào ống nghiệm (3)', 'success', 3);

        if (tubeStates[3].reagents.includes('naoh')) {
          startTube3Reaction();
        } else {
          showNotification(
            'Đã cho 2 mL CuSO₄ màu xanh lam vào ống (3). Hãy dùng ống nhỏ giọt thêm dung dịch NaOH vào.',
            'info'
          );
        }
        return;
      }

      if (reagent === 'naoh') {
        if (tubeStates[3].reagents.includes('naoh')) {
          showNotification('Ống nghiệm (3) đã có dung dịch NaOH rồi!', 'info');
          return;
        }
        setTubeStates((prev) => ({
          ...prev,
          3: {
            ...prev[3],
            liquidVolume: prev[3].liquidVolume + 35,
            reagents: Array.from(new Set([...prev[3].reagents, 'naoh'])),
          },
        }));
        setCorrectCount((c) => c + 1);
        addLog('Dùng ống nhỏ giọt thêm dung dịch NaOH vào ống nghiệm (3)', 'success', 3);

        if (tubeStates[3].reagents.includes('cuso4')) {
          startTube3Reaction();
        } else {
          showNotification('Đã cho NaOH vào ống (3). Hãy cho thêm dung dịch CuSO₄ để quan sát kết tủa.', 'info');
        }
        return;
      }

      // Wrong reagent for Tube 3
      setErrorCount((e) => e + 1);
      soundManager.playWarning();
      addLog(`Thao tác chưa phù hợp: Cho ${reagent.toUpperCase()} vào ống (3)`, 'warning', 3);
      showNotification(
        `Lưu ý: Ống (3) là thí nghiệm giữa CuSO₄ và NaOH. Hóa chất ${reagent.toUpperCase()} không phù hợp.`,
        'warning'
      );
      return;
    }
  };

  const startTube1Reaction = () => {
    soundManager.playSuccess();
    setTubeStates((prev) => ({
      ...prev,
      1: {
        ...prev[1],
        isReacting: true,
        reactionType: 'effervescence',
        bubblesCount: 60,
        stageName: 'Đang sủi bọt khí H₂',
        scientificNote: 'Có bọt khí H₂ sinh ra từ bề mặt kẽm, Zn tan dần.',
      },
    }));
    setCompletedExperiments((prev) => new Set([...prev, 1]));
    addLog('Thí nghiệm 1 hoàn thành: Phản ứng sinh khí H₂ sủi bọt', 'success', 1);
    showNotification(
      'Thành công! Ở ống (1), kẽm tác dụng với axit clohiđric sinh ra bọt khí hiđro (H₂↑) sủi bọt nổi lên.',
      'success'
    );
  };

  const completeTube2Observation = () => {
    soundManager.playSuccess();
    setTubeStates((prev) => ({
      ...prev,
      2: {
        ...prev[2],
        isReacting: true,
        reactionType: 'no_reaction',
        stageName: 'Không có hiện tượng',
        scientificNote: 'Dung dịch vẫn trong suốt không màu, không có phản ứng tạo chất mới.',
      },
    }));
    setCompletedExperiments((prev) => new Set([...prev, 2]));
    addLog('Thí nghiệm 2 hoàn thành: Dung dịch không màu, không phản ứng', 'success', 2);
    showNotification(
      'Thí nghiệm 2: Khi trộn BaCl₂ và HCl loãng, dung dịch vẫn trong suốt không màu, KHÔNG có phản ứng hóa học thông thường tạo chất mới!',
      'info'
    );
  };

  const startTube3Reaction = () => {
    soundManager.playSuccess();
    setTubeStates((prev) => ({
      ...prev,
      3: {
        ...prev[3],
        isReacting: true,
        reactionType: 'precipitate',
        precipitateAmount: 0.9,
        liquidColor: '#0284c7',
        liquidOpacity: 0.9,
        stageName: 'Xuất hiện kết tủa xanh',
        scientificNote: 'Tạo chất kết tủa mới Cu(OH)₂ màu xanh lam dạng bông xốp.',
      },
    }));
    setCompletedExperiments((prev) => new Set([...prev, 3]));
    addLog('Thí nghiệm 3 hoàn thành: Xuất hiện kết tủa Cu(OH)₂ màu xanh lam', 'success', 3);
    showNotification(
      'Thành công! Ở ống (3), xuất hiện chất kết tủa mới Cu(OH)₂↓ màu xanh lam dạng bông xốp lơ lửng rồi lắng dần.',
      'success'
    );
  };

  // Reset single tube
  const handleResetTube = (tubeNum: number) => {
    setTubeStates((prev) => ({
      ...prev,
      [tubeNum]: { ...INITIAL_TUBES[tubeNum] },
    }));
    setCompletedExperiments((prev) => {
      const next = new Set(prev);
      next.delete(tubeNum);
      return next;
    });
    addLog(`Làm sạch ống nghiệm (${tubeNum})`, 'info', tubeNum);
    showNotification(`Đã làm sạch ống nghiệm (${tubeNum}). Em có thể thực hành lại.`, 'info');
  };

  // Reset all
  const handleResetAll = () => {
    setTubeStates(INITIAL_TUBES);
    setCompletedExperiments(new Set());
    setSelectedReagent(null);
    addLog('Đặt lại toàn bộ phòng thí nghiệm', 'info');
    showNotification('Đã đặt lại toàn bộ phòng thí nghiệm. Cả 3 ống nghiệm đã được làm sạch.', 'info');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Main Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            5Đ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm md:text-base tracking-tight text-white">
                AI–5Đ LAB 3D
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Phòng Thí Nghiệm Hóa Học 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Bài: <strong>Dấu hiệu nhận biết có chất mới tạo thành</strong> (Khoa học tự nhiên 8 – Kết nối tri thức)
            </p>
          </div>
        </div>

        {/* Mobile View Switcher Tabs */}
        <div className="flex md:hidden items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMobileTab('guide')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              mobileTab === 'guide' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hướng dẫn</span>
          </button>
          <button
            onClick={() => setMobileTab('lab')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              mobileTab === 'lab' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Phòng 3D</span>
          </button>
          <button
            onClick={() => setMobileTab('worksheet')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              mobileTab === 'worksheet' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Phiếu HT</span>
          </button>
        </div>

        {/* Desktop Quick Progress Summary */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Tiến độ 3 Thí nghiệm:</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((num) => (
                <span
                  key={num}
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    completedExperiments.has(num)
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {completedExperiments.has(num) ? '✓' : num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Zone Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* KHU 1: Bên Trái (25%) - Bảng Hướng dẫn thí nghiệm */}
        <div
          className={`w-full md:w-[28%] lg:w-[25%] flex-shrink-0 h-full ${
            mobileTab === 'guide' ? 'block' : 'hidden md:block'
          }`}
        >
          <SidebarGuide
            tubeStates={tubeStates}
            completedExperiments={completedExperiments}
            activeExpTab={activeExpTab}
            setActiveExpTab={setActiveExpTab}
            correctCount={correctCount}
            errorCount={errorCount}
            elapsedSeconds={elapsedSeconds}
            onResetTube={handleResetTube}
            onResetAll={handleResetAll}
            onFocusTube={(tubeNum) => {
              setActiveExpTab(tubeNum);
              setMobileTab('lab');
            }}
          />
        </div>

        {/* KHU 2: Ở Giữa (50%) - Không gian 3D Phòng thí nghiệm */}
        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'lab' ? 'block' : 'hidden md:block'
          }`}
        >
          <LabCanvas
            tubeStates={tubeStates}
            selectedReagent={selectedReagent}
            onSelectReagent={setSelectedReagent}
            onApplyReagentToTube={handleApplyReagentToTube}
            onResetTube={handleResetTube}
            onResetAll={handleResetAll}
            feedbackMessage={feedback}
          />
        </div>

        {/* KHU 3: Bên Phải (25%) - Phiếu học tập điện tử */}
        <div
          className={`w-full md:w-[32%] lg:w-[26%] flex-shrink-0 h-full ${
            mobileTab === 'worksheet' ? 'block' : 'hidden md:block'
          }`}
        >
          <WorksheetPanel
            worksheetData={worksheetData}
            setWorksheetData={setWorksheetData}
            completedExpCount={completedExperiments.size}
            logs={actionLogs}
            elapsedSeconds={elapsedSeconds}
          />
        </div>
      </div>
    </div>
  );
}
