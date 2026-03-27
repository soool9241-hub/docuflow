'use client'

import { useCallback } from 'react'
import Button from '@/components/ui/Button'
import { DocumentItem } from '@/types'

interface ItemsEditorProps {
  items: DocumentItem[]
  onChange: (items: DocumentItem[]) => void
}

function createEmptyItem(): DocumentItem {
  return {
    name: '',
    specification: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    tax: 0,
    note: '',
  }
}

export default function ItemsEditor({ items, onChange }: ItemsEditorProps) {
  const updateItem = useCallback(
    (index: number, field: keyof DocumentItem, value: string | number) => {
      const updated = [...items]
      const item = { ...updated[index], [field]: value }

      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : item.quantity
        const price = field === 'unit_price' ? Number(value) : item.unit_price
        item.amount = qty * price
        item.tax = Math.floor(item.amount * 0.1)
      }

      updated[index] = item
      onChange(updated)
    },
    [items, onChange]
  )

  const addItem = useCallback(() => {
    onChange([...items, createEmptyItem()])
  }, [items, onChange])

  const removeItem = useCallback(
    (index: number) => {
      if (items.length <= 1) return
      const updated = items.filter((_, i) => i !== index)
      onChange(updated)
    },
    [items, onChange]
  )

  const supplyTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxTotal = items.reduce((sum, item) => sum + item.tax, 0)
  const grandTotal = supplyTotal + taxTotal

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-600 w-8">번호</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[160px]">품목명</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[100px]">규격</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">수량</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">단가</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">금액</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[100px]">비고</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                <td className="px-3 py-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="품목명 입력"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="text"
                    value={item.specification}
                    onChange={(e) => updateItem(index, 'specification', e.target.value)}
                    placeholder="규격"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    min={1}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-right"
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    min={0}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-800">
                  {item.amount.toLocaleString()}원
                </td>
                <td className="px-3 py-1">
                  <input
                    type="text"
                    value={item.note || ''}
                    onChange={(e) => updateItem(index, 'note', e.target.value)}
                    placeholder="비고"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </td>
                <td className="px-3 py-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="항목 삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={addItem} type="button" className="min-h-[44px]">
          + 항목 추가
        </Button>

        <div className="text-sm space-y-1 text-right min-w-[240px]">
          <div className="flex justify-between text-gray-600">
            <span>공급가액:</span>
            <span className="font-medium">{supplyTotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>세액 (10%):</span>
            <span className="font-medium">{taxTotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-300 pt-1 mt-1">
            <span>합계:</span>
            <span>{grandTotal.toLocaleString()}원</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { createEmptyItem }
