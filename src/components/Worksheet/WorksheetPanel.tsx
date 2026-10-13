import React, { useState } from 'react';
import { WorksheetData, ActionLogItem } from '../../types/lab';
import { exportWorksheetHTML } from '../../services/exportWorksheet';
import confetti from 'canvas-confetti';
import {
  FileText,
  Download,
  Printer,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface WorksheetPanelProps {
  worksheetData: WorksheetData;
  setWorksheetData: React.Dispatch<React.SetStateAction<WorksheetData>>;
  completedExpCount: number;
  logs: ActionLogItem[];
  elapsedSeconds: number;
}

export const WorksheetPanel: React.FC<WorksheetPanelProps> = ({
  worksheetData,
  setWorksheetData,
  completedExpCount,
  logs,
  elapsedSeconds,
}) => {
  const [showStandardKnowledge, setShowStandardKnowledge] = useState<boolean>(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const handleInputChange = (field: keyof WorksheetData, value: string) => {
    setWorksheetData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationWarning) setValidationWarning(null);
  };

  // Check if minimum fields are filled
  const isReadyToSubmit =
    worksheetData.studentName.trim().length > 0 &&
    worksheetData.studentClass.trim().length > 0 &&
    worksheetData.q1_prediction.trim().length > 0 &&
    worksheetData.q2_tube1_phenomenon.trim().length > 0 &&
    worksheetData.q3_tube2_phenomenon.trim().length > 0 &&
    worksheetData.q4_tube3_phenomenon.trim().length > 0 &&
    worksheetData.q5_reaction_identification.trim().length > 0 &&
    worksheetData.q6_chemical_equations.trim().length > 0 &&
    worksheetData.q7_ai_critique.trim().length > 0;

  const handleExportWorksheet = () => {
    if (!worksheetData.studentName.trim() || !worksheetData.studentClass.trim()) {
      setValidationWarning('Vui lòng nhập Họ và tên cùng Lớp của em trước khi xuất phiếu!');
      return;
    }

    if (completedExpCount < 3) {
      setValidationWarning(
        `Em mới làm ${completedExpCount}/3 thí nghiệm. Khuyến khích hoàn thành cả 3 thí nghiệm để ghi nhận đầy đủ minh chứng thực hành!`
      );
    }

    // Mark as submitted
    setWorksheetData((prev) => ({
      ...prev,
      isSubmitted: true,
      submittedAt: new Date().toISOString(),
    }));

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Export HTML and trigger print-to-PDF
    exportWorksheetHTML(worksheetData, completedExpCount, logs, elapsedSeconds);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 overflow-y-auto">
      {/* Worksheet Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Phiếu Học Tập Cá Nhân</h2>
              <p className="text-[11px] text-slate-400">Ghi nhận dự đoán, hiện tượng & kết luận</p>
            </div>
          </div>

          {worksheetData.isSubmitted && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Đã nộp bài
            </span>
          )}
        </div>

        {/* Student identification */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-sky-400" /> Họ và tên *
            </label>
            <input
              type="text"
              value={worksheetData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-sky-400" /> Lớp *
            </label>
            <input
              type="text"
              value={worksheetData.studentClass}
              onChange={(e) => handleInputChange('studentClass', e.target.value)}
              placeholder="Ví dụ: 8A1"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Warning message if validation fails */}
      {validationWarning && (
        <div className="m-3 p-3 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{validationWarning}</div>
        </div>
      )}

      {/* Questions Form Body */}
      <div className="p-4 space-y-4 flex-1 text-xs">
        {/* Câu 1 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 1. Dự đoán ban đầu: Trong ba ống nghiệm, ống nào có thể xảy ra phản ứng hóa học? Vì sao?
          </label>
          <textarea
            rows={2}
            value={worksheetData.q1_prediction}
            onChange={(e) => handleInputChange('q1_prediction', e.target.value)}
            placeholder="Nhập dự đoán của em trước khi thực hành..."
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Câu 2 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 2. Mô tả hiện tượng em quan sát được ở ống nghiệm (1) (Kẽm Zn + HCl loãng):
          </label>
          <textarea
            rows={2}
            value={worksheetData.q2_tube1_phenomenon}
            onChange={(e) => handleInputChange('q2_tube1_phenomenon', e.target.value)}
            placeholder="Mô tả bọt khí sinh ra từ đâu? Màu dung dịch? Viên kẽm biến đổi ra sao?..."
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Câu 3 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 3. Mô tả hiện tượng em quan sát được ở ống nghiệm (2) (Dung dịch BaCl₂ + HCl):
          </label>
          <textarea
            rows={2}
            value={worksheetData.q3_tube2_phenomenon}
            onChange={(e) => handleInputChange('q3_tube2_phenomenon', e.target.value)}
            placeholder="Dung dịch có biến đổi màu không? Có khí hay kết tủa xuất hiện không?..."
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Câu 4 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 4. Mô tả hiện tượng em quan sát được ở ống nghiệm (3) (Dung dịch CuSO₄ + NaOH):
          </label>
          <textarea
            rows={2}
            value={worksheetData.q4_tube3_phenomenon}
            onChange={(e) => handleInputChange('q4_tube3_phenomenon', e.target.value)}
            placeholder="Khi nhỏ NaOH vào CuSO₄, xuất hiện chất gì? Màu sắc và trạng thái ra sao?..."
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Câu 5 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 5. Những ống nghiệm nào xảy ra phản ứng hóa học? Dựa vào dấu hiệu nào để kết luận?
          </label>
          <textarea
            rows={2}
            value={worksheetData.q5_reaction_identification}
            onChange={(e) => handleInputChange('q5_reaction_identification', e.target.value)}
            placeholder="Dấu hiệu nhận biết: chất khí thoát ra, chất kết tủa mới tạo thành..."
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Câu 6 */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block leading-tight">
            Câu 6. Viết phương trình hóa học của các phản ứng xảy ra:
          </label>
          <textarea
            rows={2}
            value={worksheetData.q6_chemical_equations}
            onChange={(e) => handleInputChange('q6_chemical_equations', e.target.value)}
            placeholder="Tự viết PTHH (Ví dụ: Zn + ... -> ...)"
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none font-mono"
          />
        </div>

        {/* Câu 7: Phản biện nhận định AI */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-blue-500/30">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-sky-300 text-[11px] block">
                Câu 7. Phản biện nhận định của AI:
              </span>
              <p className="text-[11px] text-slate-300 italic mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                “Chỉ ống nghiệm (1) xảy ra phản ứng hóa học. Ống nghiệm (3) chỉ có sự thay đổi màu sắc, không tạo ra chất mới.”
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Em có đồng ý với nhận định trên của AI không? Hãy sử dụng bằng chứng quan sát để giải thích:
          </p>
          <textarea
            rows={3}
            value={worksheetData.q7_ai_critique}
            onChange={(e) => handleInputChange('q7_ai_critique', e.target.value)}
            placeholder="Em không đồng ý vì ở ống nghiệm (3) xuất hiện chất kết tủa mới không tan Cu(OH)2..."
            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs resize-none"
          />
        </div>

        {/* Submission & Export Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleExportWorksheet}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải Phiếu học tập & Lưu file nộp</span>
          </button>
          <p className="text-[10px] text-center text-slate-500">
            File được tạo dưới dạng HTML/PDF chuẩn hóa với tên và lớp của em, kèm nhật ký thực nghiệm.
          </p>
        </div>

        {/* Section IX: KHÓA KIẾN THỨC SAU THỰC NGHIỆM */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          {!worksheetData.isSubmitted ? (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-300 text-xs">Kiến thức chuẩn đang được khóa</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Phương trình hóa học và kết luận chuẩn của giáo viên sẽ được mở khóa sau khi em tải phiếu học tập.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowStandardKnowledge(!showStandardKnowledge)}
                className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                {showStandardKnowledge ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>
                  {showStandardKnowledge ? 'Đóng kiến thức chuẩn' : '🔓 ĐỐI CHIẾU KIẾN THỨC CHUẨN'}
                </span>
              </button>

              {showStandardKnowledge && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>KIẾN THỨC CHUẨN KHOA HỌC (KHTN 8)</span>
                  </div>

                  {/* Ống 1 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-sky-400">1. Ống nghiệm (1) – Có phản ứng:</span>
                    <p className="text-slate-300">
                      • <strong>Dấu hiệu:</strong> Có bọt khí không màu thoát ra (khí hiđro H₂), kẽm tan dần.
                    </p>
                    <p className="font-mono text-xs bg-slate-900 p-1.5 rounded text-emerald-300 border border-slate-800">
                      Zn + 2HCl → ZnCl₂ + H₂↑
                    </p>
                  </div>

                  {/* Ống 2 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-sky-400">2. Ống nghiệm (2) – Không phản ứng:</span>
                    <p className="text-slate-300">
                      • <strong>Dấu hiệu:</strong> Dung dịch vẫn trong suốt không màu, không sủi bọt khí, không kết tủa.
                    </p>
                    <p className="text-slate-400 italic">
                      BaCl₂ + HCl → Không xảy ra phản ứng trong điều kiện này (không tạo chất mới).
                    </p>
                  </div>

                  {/* Ống 3 */}
                  <div className="space-y-1">
                    <span className="font-semibold text-sky-400">3. Ống nghiệm (3) – Có phản ứng:</span>
                    <p className="text-slate-300">
                      • <strong>Dấu hiệu:</strong> Xuất hiện chất kết tủa mới màu xanh lam (dạng bông xốp lơ lửng, sau đó lắng xuống đáy).
                    </p>
                    <p className="font-mono text-xs bg-slate-900 p-1.5 rounded text-emerald-300 border border-slate-800">
                      CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄
                    </p>
                  </div>

                  {/* Phản biện AI */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="font-semibold text-amber-300">Nhận xét phản biện AI:</span>
                    <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                      Nhận định của AI là <strong>SAI</strong>. Ống (3) tạo ra chất mới là kết tủa đồng(II) hiđroxit Cu(OH)₂ màu xanh lam không tan trong nước, chứ không đơn thuần chỉ là sự đổi màu chất lỏng. Do đó cả ống (1) và ống (3) đều có phản ứng hóa học xảy ra!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
