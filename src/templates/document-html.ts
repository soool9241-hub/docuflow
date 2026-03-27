import { Document, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types'

export function generateDocumentHTML(document: Document, type: DocumentType): string {
  const typeLabel = DOCUMENT_TYPE_LABELS[type]
  const items = document.items || []
  const supplyTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const taxTotal = items.reduce((sum, item) => sum + (item.tax || 0), 0)
  const grandTotal = supplyTotal + taxTotal
  const issuer = document.issuer_info || {}
  const receiver = document.receiver_info || {}
  const issueDate = document.created_at
    ? new Date(document.created_at).toLocaleDateString('ko-KR')
    : new Date().toLocaleDateString('ko-KR')

  const itemRows = items
    .map(
      (item, index) => `
    <tr>
      <td style="border:1px solid #999;padding:6px 8px;text-align:center;">${index + 1}</td>
      <td style="border:1px solid #999;padding:6px 8px;">${item.name || ''}</td>
      <td style="border:1px solid #999;padding:6px 8px;">${item.specification || ''}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;">${item.quantity.toLocaleString()}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;">${item.unit_price.toLocaleString()}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;">${item.amount.toLocaleString()}</td>
      <td style="border:1px solid #999;padding:6px 8px;text-align:right;">${(item.tax || 0).toLocaleString()}</td>
      <td style="border:1px solid #999;padding:6px 8px;">${item.note || ''}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${typeLabel} - ${document.title || ''}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Malgun Gothic','맑은 고딕',sans-serif;">
  <div style="max-width:800px;margin:20px auto;background:#fff;border:1px solid #ddd;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="border-bottom:4px solid #1e3a5f;padding:32px 40px 16px;">
      <h1 style="text-align:center;font-size:28px;color:#1e3a5f;letter-spacing:8px;margin:0 0 8px;">${typeLabel}</h1>
      <table style="width:100%;font-size:13px;color:#666;margin-top:16px;">
        <tr>
          <td style="text-align:left;">서류번호: ${document.document_number || '-'}</td>
          <td style="text-align:right;">발행일: ${issueDate}</td>
        </tr>
      </table>
    </div>

    <!-- Issuer / Receiver -->
    <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #ccc;">
      <tr>
        <td style="width:50%;padding:24px;border-right:1px solid #ccc;vertical-align:top;">
          <p style="font-size:12px;font-weight:bold;color:#888;margin:0 0 12px;letter-spacing:2px;">공급자 (발행인)</p>
          <table style="font-size:13px;width:100%;">
            <tr><td style="color:#888;padding:3px 0;width:80px;">상호</td><td style="font-weight:bold;padding:3px 0;">${issuer.company_name || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">대표자</td><td style="padding:3px 0;">${issuer.representative || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">사업자번호</td><td style="padding:3px 0;">${issuer.business_number || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">주소</td><td style="padding:3px 0;">${issuer.address || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">연락처</td><td style="padding:3px 0;">${issuer.phone || '-'}</td></tr>
          </table>
        </td>
        <td style="width:50%;padding:24px;vertical-align:top;">
          <p style="font-size:12px;font-weight:bold;color:#888;margin:0 0 12px;letter-spacing:2px;">공급받는자 (거래처)</p>
          <table style="font-size:13px;width:100%;">
            <tr><td style="color:#888;padding:3px 0;width:80px;">상호</td><td style="font-weight:bold;padding:3px 0;">${receiver.company_name || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">대표자</td><td style="padding:3px 0;">${receiver.representative || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">사업자번호</td><td style="padding:3px 0;">${receiver.business_number || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">주소</td><td style="padding:3px 0;">${receiver.address || '-'}</td></tr>
            <tr><td style="color:#888;padding:3px 0;">연락처</td><td style="padding:3px 0;">${receiver.phone || '-'}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      document.title
        ? `<!-- Title -->
    <div style="padding:16px 40px;border-bottom:1px solid #eee;background:#f9f9f9;text-align:center;">
      <span style="font-size:14px;color:#333;">건명: <strong>${document.title}</strong></span>
    </div>`
        : ''
    }

    <!-- Total Summary -->
    <div style="padding:16px 40px;border-bottom:1px solid #ccc;">
      <table style="width:100%;text-align:center;font-size:13px;">
        <tr>
          <td>
            <span style="color:#888;">공급가액</span><br/>
            <strong style="font-size:16px;">${supplyTotal.toLocaleString()}원</strong>
          </td>
          <td>
            <span style="color:#888;">세액</span><br/>
            <strong style="font-size:16px;">${taxTotal.toLocaleString()}원</strong>
          </td>
          <td>
            <span style="color:#888;">합계금액</span><br/>
            <strong style="font-size:20px;color:#1e3a5f;">${grandTotal.toLocaleString()}원</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="padding:24px 40px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#e8edf2;">
            <th style="border:1px solid #999;padding:8px;text-align:center;width:40px;">번호</th>
            <th style="border:1px solid #999;padding:8px;text-align:left;">품목명</th>
            <th style="border:1px solid #999;padding:8px;text-align:left;width:70px;">규격</th>
            <th style="border:1px solid #999;padding:8px;text-align:right;width:50px;">수량</th>
            <th style="border:1px solid #999;padding:8px;text-align:right;width:80px;">단가</th>
            <th style="border:1px solid #999;padding:8px;text-align:right;width:90px;">공급가액</th>
            <th style="border:1px solid #999;padding:8px;text-align:right;width:70px;">세액</th>
            <th style="border:1px solid #999;padding:8px;text-align:left;width:70px;">비고</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="8" style="border:1px solid #999;padding:12px;text-align:center;color:#aaa;">항목 없음</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#f5f5f5;font-weight:bold;">
            <td colspan="5" style="border:1px solid #999;padding:8px;text-align:center;">합 계</td>
            <td style="border:1px solid #999;padding:8px;text-align:right;">${supplyTotal.toLocaleString()}</td>
            <td style="border:1px solid #999;padding:8px;text-align:right;">${taxTotal.toLocaleString()}</td>
            <td style="border:1px solid #999;padding:8px;"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${
      document.notes
        ? `<!-- Notes -->
    <div style="padding:0 40px 24px;">
      <div style="background:#f9f9f9;border-radius:6px;padding:12px 16px;font-size:13px;color:#555;">
        <strong style="color:#444;">비고:</strong> ${document.notes}
      </div>
    </div>`
        : ''
    }

    <!-- Stamp Area -->
    <div style="padding:24px 40px;border-top:1px solid #eee;text-align:right;">
      <div style="display:inline-block;text-align:center;">
        <div style="width:96px;height:96px;border:2px dashed #ccc;border-radius:8px;line-height:96px;color:#aaa;font-size:12px;margin:0 auto;">
          인감/도장
        </div>
        <p style="font-size:11px;color:#888;margin:4px 0 0;">공급자</p>
      </div>
    </div>

  </div>
</body>
</html>`
}
