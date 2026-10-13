import { WorksheetData, ActionLogItem } from '../types/lab';

export function exportWorksheetHTML(
  data: WorksheetData,
  completedExpCount: number,
  logs: ActionLogItem[],
  elapsedSeconds: number
) {
  const safeName = (data.studentName || 'HocSinh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  const safeClass = (data.studentClass || '8A').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Phieu_Hoc_Tap_KHTN8_${safeName}_${safeClass}.html`;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu học tập KHTN 8 - ${data.studentName || 'Học sinh'} - Lớp ${data.studentClass || ''}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #1e293b;
      background-color: #f8fafc;
      line-height: 1.6;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .title {
      text-align: center;
      margin: 15px 0 5px;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .subtitle {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 20px;
    }
    .student-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      border: 1px solid #cbd5e1;
    }
    .student-info-item {
      font-size: 14px;
    }
    .student-info-item strong {
      color: #334155;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-info { background: #e0e7ff; color: #3730a3; }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 20px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .question-block {
      margin-bottom: 16px;
      background: #fafafa;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .question-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .answer-box {
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      font-size: 13.5px;
      color: #0f172a;
      white-space: pre-wrap;
      min-height: 40px;
    }
    .empty-answer {
      color: #94a3b8;
      font-style: italic;
    }
    .log-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 10px;
    }
    .log-table th, .log-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
    }
    .log-table th {
      background: #f1f5f9;
      font-weight: 600;
    }
    .teacher-box {
      margin-top: 30px;
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 16px;
      background: #ffffff;
    }
    .teacher-box h4 {
      margin: 0 0 10px;
      font-size: 14px;
      color: #334155;
    }
    .print-bar {
      margin-bottom: 20px;
      text-align: center;
    }
    .btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(37,99,235,0.2);
    }
    .btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn" onclick="window.print()">🖨️ In hoặc Lưu dạng PDF</button>
  </div>

  <div class="container">
    <table class="header-table">
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #475569;">
          BỘ GD&ĐT – BỘ SÁCH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG<br>
          MÔN KHOA HỌC TỰ NHIÊN 8 (PHẦN HÓA HỌC)
        </td>
        <td style="text-align: right; font-size: 12px; color: #64748b;">
          Phần mềm mô phỏng: <strong>AI–5Đ LAB 3D</strong><br>
          Ngày nộp: ${new Date().toLocaleDateString('vi-VN')}
        </td>
      </tr>
    </table>

    <div class="title">PHIẾU BÁO CÁO THỰC HÀNH HÓA HỌC</div>
    <div class="subtitle">BÀI: DẤU HIỆU NHẬN BIẾT CÓ CHẤT MỚI TẠO THÀNH</div>

    <div class="student-info-grid">
      <div class="student-info-item"><strong>Họ và tên:</strong> ${data.studentName || 'Chưa điền'}</div>
      <div class="student-info-item"><strong>Lớp:</strong> ${data.studentClass || 'Chưa điền'}</div>
      <div class="student-info-item"><strong>Thời gian thực hành:</strong> ${formatTime(elapsedSeconds)}</div>
      <div class="student-info-item"><strong>Trạng thái thực nghiệm:</strong> <span class="badge ${completedExpCount === 3 ? 'badge-success' : 'badge-info'}">Đã hoàn thành ${completedExpCount}/3 thí nghiệm</span></div>
    </div>

    <div class="section-title">I. BÁO CÁO KẾT QUẢ VÀ TRẢ LỜI CÂU HỎI</div>

    <div class="question-block">
      <div class="question-title">Câu 1. Dự đoán ban đầu: Trong ba ống nghiệm, ống nào có thể xảy ra phản ứng hóa học? Vì sao?</div>
      <div class="answer-box ${!data.q1_prediction ? 'empty-answer' : ''}">${data.q1_prediction || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 2. Mô tả hiện tượng em quan sát được ở ống nghiệm (1) (Kẽm Zn + Dung dịch HCl loãng):</div>
      <div class="answer-box ${!data.q2_tube1_phenomenon ? 'empty-answer' : ''}">${data.q2_tube1_phenomenon || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 3. Mô tả hiện tượng em quan sát được ở ống nghiệm (2) (Dung dịch BaCl₂ + Dung dịch HCl):</div>
      <div class="answer-box ${!data.q3_tube2_phenomenon ? 'empty-answer' : ''}">${data.q3_tube2_phenomenon || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 4. Mô tả hiện tượng em quan sát được ở ống nghiệm (3) (Dung dịch CuSO₄ + Dung dịch NaOH):</div>
      <div class="answer-box ${!data.q4_tube3_phenomenon ? 'empty-answer' : ''}">${data.q4_tube3_phenomenon || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 5. Những ống nghiệm nào xảy ra phản ứng hóa học? Dựa vào dấu hiệu nào để kết luận?</div>
      <div class="answer-box ${!data.q5_reaction_identification ? 'empty-answer' : ''}">${data.q5_reaction_identification || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 6. Viết phương trình hóa học của các phản ứng xảy ra:</div>
      <div class="answer-box ${!data.q6_chemical_equations ? 'empty-answer' : ''}">${data.q6_chemical_equations || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="question-block">
      <div class="question-title">Câu 7. Phản biện nhận định: AI đưa ra nhận định: "Chỉ ống nghiệm (1) xảy ra phản ứng hóa học. Ống nghiệm (3) chỉ có sự thay đổi màu sắc, không tạo ra chất mới." Em có đồng ý không? Hãy sử dụng bằng chứng quan sát để giải thích.</div>
      <div class="answer-box ${!data.q7_ai_critique ? 'empty-answer' : ''}">${data.q7_ai_critique || 'Chưa có câu trả lời'}</div>
    </div>

    <div class="section-title">II. NHẬT KÝ THAO TÁC THÍ NGHIỆM TRONG MÔ PHỎNG 3D</div>
    <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Minh chứng quá trình thao tác thực hành của học sinh:</p>
    <table class="log-table">
      <thead>
        <tr>
          <th style="width: 80px;">Thời điểm</th>
          <th>Thao tác thực hiện</th>
          <th style="width: 100px;">Đánh giá</th>
        </tr>
      </thead>
      <tbody>
        ${logs.slice(0, 15).map(log => `
          <tr>
            <td>${log.timestamp}</td>
            <td>${log.action}</td>
            <td><span class="badge ${log.type === 'success' ? 'badge-success' : 'badge-info'}">${log.type === 'success' ? 'Chính xác' : log.type === 'warning' ? 'Lưu ý' : 'Ghi nhận'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="teacher-box">
      <h4>ĐÁNH GIÁ VÀ NHẬN XÉT CỦA GIÁO VIÊN</h4>
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; font-size: 13px;">
        <div>
          <p>• Kỹ năng thao tác mô phỏng 3D: ......................................................</p>
          <p>• Khả năng quan sát & ghi nhận hiện tượng: .......................................</p>
          <p>• Năng lực lập luận, phản biện khoa học: ..........................................</p>
          <p>• Nhận xét chung: ............................................................................</p>
        </div>
        <div style="text-align: center; border-left: 1px solid #cbd5e1; padding-left: 15px;">
          <p><strong>Điểm số / Đạt:</strong></p>
          <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 15px 0;">___ / 10</div>
          <p style="font-size: 12px; color: #64748b;">(Chữ ký giáo viên)</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Download HTML file directly
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Also trigger print/preview in iframe/popup for PDF printing
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  } catch (e) {
    // If popup blocked, file was already downloaded
    console.log('Popup print window blocked, HTML file saved:', e);
  }
}
