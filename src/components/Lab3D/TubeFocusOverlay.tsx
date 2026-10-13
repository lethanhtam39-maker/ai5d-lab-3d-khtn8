import React, { useState } from 'react';
import { TubeContents } from '../../types/lab';
import { X, Eye, EyeOff, RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface TubeFocusOverlayProps {
  tubeNum: number;
  contents: TubeContents;
  onClose: () => void;
  onRotateView: () => void;
}

export const TubeFocusOverlay: React.FC<TubeFocusOverlayProps> = ({
  tubeNum,
  contents,
  onClose,
  onRotateView,
}) => {
  const [showScientificHint, setShowScientificHint] = useState<boolean>(false);

  const getTubeTitle = () => {
    switch (tubeNum) {
      case 1:
        return 'Ống nghiệm (1) – Thí nghiệm Kẽm (Zn) + Axit clohiđric (HCl)';
      case 2:
        return 'Ống nghiệm (2) – Thí nghiệm Bari clorua (BaCl₂) + Axit clohiđric (HCl)';
      case 3:
        return 'Ống nghiệm (3) – Thí nghiệm Đồng(II) sunfat (CuSO₄) + Natri hiđroxit (NaOH)';
      default:
        return `Ống nghiệm (${tubeNum})`;
    }
  };

  const getPhenomenonDescription = () => {
    if (tubeNum === 1) {
      if (contents.hasZn && contents.reactionType === 'effervescence') {
        return {
          status: 'Đang xảy ra hiện tượng mạnh mẽ',
          detail:
            'Các bọt khí nhỏ (khí hiđro H₂) liên tục sinh ra trực tiếp từ bề mặt các viên Zn, tách ra và sủi bọt nổi lên trên mặt thoáng chất lỏng. Dung dịch vẫn trong suốt không màu. Các viên kẽm tan dần theo thời gian.',
          badge: 'Khí thoát ra (H₂↑)',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      } else if (contents.hasZn) {
        return {
          status: 'Đã có viên Zn trong ống',
          detail: 'Có các viên kẽm màu xám bạc ở đáy ống nghiệm. Chưa thêm dung dịch axit HCl loãng.',
          badge: 'Chờ thêm HCl',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      } else {
        return {
          status: 'Ống nghiệm trống',
          detail: 'Ống nghiệm sạch, chưa chứa hóa chất.',
          badge: 'Chưa có chất',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        };
      }
    } else if (tubeNum === 2) {
      if (contents.reagents.includes('bacl2') && contents.reagents.includes('hcl')) {
        return {
          status: 'Đã trộn hai dung dịch',
          detail:
            'Dung dịch hòa tan hoàn toàn, tiếp tục TRONG SUỐT, KHÔNG MÀU. Không thấy bọt khí sinh ra, không xuất hiện kết tủa đục và không đổi màu. Trong điều kiện này, không có phản ứng hóa học thông thường tạo chất mới.',
          badge: 'Không có hiện tượng lạ',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      } else if (contents.reagents.length > 0) {
        return {
          status: 'Đã thêm 1 dung dịch',
          detail: 'Ống chứa dung dịch trong suốt, không màu. Hãy thêm tiếp dung dịch thứ hai để kiểm tra phản ứng.',
          badge: 'Cần thêm tiếp chất',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      } else {
        return {
          status: 'Ống nghiệm trống',
          detail: 'Ống nghiệm sạch, sẵn sàng thí nghiệm.',
          badge: 'Chưa có chất',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        };
      }
    } else if (tubeNum === 3) {
      if (contents.reactionType === 'precipitate') {
        return {
          status: 'Đã xuất hiện chất mới',
          detail:
            'Xuất hiện chất kết tủa màu XANH LAM (Cu(OH)₂) dạng những đám bông xốp mịn, lơ lửng phân tán làm dung dịch trở nên đục. Để yên sau một thời gian, các đám kết tủa lắng dần xuống đáy ống nghiệm.',
          badge: 'Xuất hiện kết tủa xanh (Cu(OH)₂↓)',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      } else if (contents.reagents.includes('cuso4')) {
        return {
          status: 'Dung dịch CuSO₄ ban đầu',
          detail: 'Dung dịch đồng(II) sunfat có màu xanh lam trong suốt đồng nhất. Hãy dùng ống nhỏ giọt thêm dung dịch NaOH.',
          badge: 'Dung dịch xanh trong',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
      } else {
        return {
          status: 'Ống nghiệm trống',
          detail: 'Ống nghiệm sạch, sẵn sàng nhận CuSO₄.',
          badge: 'Chưa có chất',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        };
      }
    }

    return {
      status: 'Trạng thái bình thường',
      detail: 'Quan sát kỹ chất lỏng và đáy ống nghiệm.',
      badge: 'Bình thường',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };
  };

  const phenomenon = getPhenomenonDescription();

  return (
    <div className="absolute top-4 left-4 right-4 z-20 pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-2xl text-slate-100 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/40">
              {tubeNum}
            </span>
            <div>
              <h3 className="font-bold text-sm md:text-base text-white tracking-wide">{getTubeTitle()}</h3>
              <p className="text-xs text-slate-400">Chế độ quan sát cận cảnh độ phân giải cao</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRotateView}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 border border-slate-700"
              title="Xoay góc nhìn để quan sát xung quanh"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xoay nhẹ</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors border border-slate-700"
              title="Đóng chế độ phóng to, trở lại toàn cảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current visual overview */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trạng thái:</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${phenomenon.badgeColor}`}>
              {phenomenon.badge}
            </span>
          </div>

          {/* Toggle observation hint button - only shown when student requests */}
          <button
            onClick={() => setShowScientificHint(!showScientificHint)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all font-medium"
          >
            {showScientificHint ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ẩn gợi ý hiện tượng</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Gợi ý dấu hiệu quan sát</span>
              </>
            )}
          </button>
        </div>

        {/* Observation hint details */}
        {showScientificHint && (
          <div className="mt-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ghi nhận chi tiết khoa học:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{phenomenon.detail}</p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hãy đối chiếu hiện tượng này để điền vào Phiếu học tập bên phải.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
