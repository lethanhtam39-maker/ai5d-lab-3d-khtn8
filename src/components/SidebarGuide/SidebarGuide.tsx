import React from 'react';
import { TubeContents, ActionLogItem } from '../../types/lab';
import {
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Award,
  ChevronRight,
  HelpCircle,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface SidebarGuideProps {
  tubeStates: { [tubeNum: number]: TubeContents };
  completedExperiments: Set<number>;
  activeExpTab: number;
  setActiveExpTab: (tab: number) => void;
  correctCount: number;
  errorCount: number;
  elapsedSeconds: number;
  onResetTube: (tubeNum: number) => void;
  onResetAll: () => void;
  onFocusTube: (tubeNum: number) => void;
}

export const SidebarGuide: React.FC<SidebarGuideProps> = ({
  tubeStates,
  completedExperiments,
  activeExpTab,
  setActiveExpTab,
  correctCount,
  errorCount,
  elapsedSeconds,
  onResetTube,
  onResetAll,
  onFocusTube,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const expConfigs = [
    {
      id: 1,
      tubeNum: 1,
      title: 'Thí nghiệm 1: Kẽm tác dụng với HCl',
      reagentsTitle: 'Kẽm viên (Zn) + Axit clohiđric loãng (HCl)',
      steps: [
        {
          label: 'Bước 1: Lấy viên Zn cho vào ống nghiệm (1)',
          isDone: tubeStates[1].hasZn,
          desc: 'Kéo thả viên Zn từ lọ hóa chất vào ống nghiệm (1) hoặc chạm chọn Zn rồi chạm ống (1).',
        },
        {
          label: 'Bước 2: Rót khoảng 3 mL dung dịch HCl loãng vào',
          isDone: tubeStates[1].reagents.includes('hcl'),
          desc: 'Kéo thả hoặc chạm chai HCl loãng chuyển vào ống nghiệm (1).',
        },
      ],
      phenomenon: 'Khí không màu thoát ra sủi bọt trên bề mặt viên kẽm, viên kẽm tan dần.',
      isCompleted: completedExperiments.has(1),
    },
    {
      id: 2,
      tubeNum: 2,
      title: 'Thí nghiệm 2: BaCl₂ và dung dịch HCl',
      reagentsTitle: 'Bari clorua (BaCl₂) + Axit clohiđric (HCl)',
      steps: [
        {
          label: 'Bước 1: Cho khoảng 2 mL dung dịch BaCl₂ vào ống nghiệm (2)',
          isDone: tubeStates[2].reagents.includes('bacl2'),
          desc: 'Dung dịch ban đầu trong suốt, không màu.',
        },
        {
          label: 'Bước 2: Thêm khoảng 3 mL dung dịch HCl loãng vào',
          isDone: tubeStates[2].reagents.includes('hcl'),
          desc: 'Quan sát kỹ xem có hiện tượng biến đổi chất hay không.',
        },
      ],
      phenomenon: 'Dung dịch vẫn trong suốt không màu, không sủi bọt khí, không kết tủa.',
      isCompleted: completedExperiments.has(2),
    },
    {
      id: 3,
      tubeNum: 3,
      title: 'Thí nghiệm 3: CuSO₄ tác dụng với NaOH',
      reagentsTitle: 'Đồng(II) sunfat (CuSO₄) + Natri hiđroxit (NaOH)',
      steps: [
        {
          label: 'Bước 1: Cho khoảng 2 mL dung dịch CuSO₄ vào ống nghiệm (3)',
          isDone: tubeStates[3].reagents.includes('cuso4'),
          desc: 'Dung dịch ban đầu có màu xanh lam trong suốt.',
        },
        {
          label: 'Bước 2: Dùng ống nhỏ giọt thêm dung dịch NaOH vào',
          isDone: tubeStates[3].reagents.includes('naoh'),
          desc: 'Kéo hoặc chạm ống nhỏ giọt NaOH vào ống nghiệm (3).',
        },
      ],
      phenomenon: 'Xuất hiện kết tủa màu xanh lam dạng bông xốp lơ lửng, làm đục dung dịch và lắng dần.',
      isCompleted: completedExperiments.has(3),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200 overflow-y-auto">
      {/* Subject Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            KHTN 8 • Kết Nối Tri Thức
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Hóa học THCS</span>
        </div>
        <h1 className="text-base font-bold text-white tracking-tight leading-snug">
          Dấu Hiệu Nhận Biết Có Chất Mới Tạo Thành
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quan sát các dấu hiệu: sinh khí, đổi màu, xuất hiện kết tủa hoặc không phản ứng.
        </p>

        {/* Practice Live Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Thời gian
            </span>
            <span className="text-xs font-mono font-bold text-sky-300 block mt-0.5">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Thao tác đúng
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
              {correctCount}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" /> Cần lưu ý
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 block mt-0.5">
              {errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Progress status overview */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Tiến độ thực hành:</span>
        <span className="font-semibold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
          {completedExperiments.size} / 3 Thí nghiệm xong
        </span>
      </div>

      {/* Experiment Accordions */}
      <div className="p-3 space-y-3 flex-1">
        {expConfigs.map((exp) => {
          const isActive = activeExpTab === exp.id;
          return (
            <div
              key={exp.id}
              className={`rounded-xl border transition-all ${
                isActive
                  ? 'border-blue-500/60 bg-slate-800/80 shadow-md'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              {/* Header button */}
              <button
                onClick={() => setActiveExpTab(exp.id)}
                className="w-full p-3 text-left flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      exp.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {exp.isCompleted ? '✓' : exp.id}
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-white leading-tight">{exp.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{exp.reagentsTitle}</p>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isActive ? 'rotate-90 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* Body */}
              {isActive && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-2.5 text-xs animate-fadeIn">
                  <div className="space-y-2">
                    {exp.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-2 rounded-lg border ${
                          st.isDone
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span
                            className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                              st.isDone ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {st.isDone ? '✓' : sIdx + 1}
                          </span>
                          <span>{st.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 pl-5.5 leading-relaxed">{st.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions for this tube */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onFocusTube(exp.tubeNum)}
                      className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Phóng to ống ({exp.tubeNum})</span>
                    </button>

                    <button
                      onClick={() => onResetTube(exp.tubeNum)}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[11px] flex items-center gap-1 transition-colors"
                      title="Làm lại riêng ống nghiệm này"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đặt lại</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom quick help & reset all */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
        <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" /> Hướng dẫn thao tác 3D:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
            <li>Xoay 3D: Nhấn giữ chuột trái và kéo.</li>
            <li>Thu phóng: Cuộn chuột hoặc chạm 2 ngón.</li>
            <li>Rót hóa chất: Kéo chai vào ống HOẶC bấm chai rồi bấm ống.</li>
          </ul>
        </div>

        <button
          onClick={onResetAll}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Làm lại toàn bộ thí nghiệm</span>
        </button>
      </div>
    </div>
  );
};
