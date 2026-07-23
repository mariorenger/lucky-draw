
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, User, Gift, AlertCircle, Edit2, AlertTriangle } from 'lucide-react';
import { Employee, Prize, Winner } from '../types';

interface DataManagerProps {
  employees: Employee[];
  prizes: Prize[];
  winners: Winner[];
  onUpdateEmployees: (data: Employee[]) => void;
  onUpdatePrizes: (data: Prize[]) => void;
  onClose: () => void;
}

// Internal Modal Interface
interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({ 
  employees, prizes, winners, onUpdateEmployees, onUpdatePrizes, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'prizes'>('employees');
  const [localEmployees, setLocalEmployees] = useState<any[]>([]);
  const [localPrizes, setLocalPrizes] = useState<any[]>([]);
  
  // Custom confirm modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  // Initialize local state
  useEffect(() => {
    setLocalEmployees(JSON.parse(JSON.stringify(employees)));
    setLocalPrizes(JSON.parse(JSON.stringify(prizes)));
  }, [employees, prizes]);

  const getCurrentData = () => activeTab === 'employees' ? localEmployees : localPrizes;
  const setCurrentData = (data: any[]) => activeTab === 'employees' ? setLocalEmployees(data) : setLocalPrizes(data);

  // Helper to get all unique keys from data (mainly for employees now)
  const getColumns = (data: any[]) => {
    const keys = new Set<string>();
    // Add default keys first
    if (activeTab === 'employees') {
        keys.add('name');
        keys.add('email');
        keys.add('department');
    } else {
        keys.add('name');
        keys.add('originalQuantity');
    }
    
    // Add other keys found in data
    data.forEach(item => {
      Object.keys(item).forEach(k => {
        if (k !== 'id' && k !== 'originalQuantity' && k !== 'quantity' && k !== 'image') keys.add(k);
      });
    });
    return Array.from(keys);
  };

  const columns = getColumns(getCurrentData());

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...getCurrentData()];
    newData[rowIndex][column] = value;
    setCurrentData(newData);
  };

  const addRow = () => {
    if (activeTab === 'employees') {
        const newData = [...localEmployees];
        const newId = `emp-${Date.now()}`;
        const newRow: any = { id: newId };
        columns.forEach(col => {
            newRow[col] = '';
        });
        setLocalEmployees([newRow, ...newData]);
    } else {
        const newData = [...localPrizes];
        const newId = `prize-${Date.now()}`;
        const newRow = {
            id: newId,
            name: '',
            quantity: 1,
            originalQuantity: 1
        };
        setLocalPrizes([newRow, ...newData]);
    }
  };

  const deleteRow = (rowIndex: number) => {
    setConfirmModal({
        isOpen: true,
        title: "Xóa dữ liệu",
        message: "Bạn có chắc chắn muốn xóa dòng này không?",
        onConfirm: () => {
            const newData = [...getCurrentData()];
            newData.splice(rowIndex, 1);
            setCurrentData(newData);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const addColumn = () => {
    if (activeTab !== 'employees') return;
    const name = prompt("Nhập tên cột mới (Ví dụ: Chi nhánh):");
    if (name && !columns.includes(name)) {
        const newData = localEmployees.map(item => ({ ...item, [name]: '' }));
        setLocalEmployees(newData);
    }
  };

  const deleteColumn = (col: string) => {
    if (activeTab !== 'employees') return;
    if (['name', 'email'].includes(col)) {
        setConfirmModal({
            isOpen: true,
            title: "Không thể xóa",
            message: "Đây là cột dữ liệu bắt buộc của hệ thống.",
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
        return;
    }
    
    setConfirmModal({
        isOpen: true,
        title: "Xóa cột",
        message: `Bạn có chắc muốn xóa cột "${col}" và toàn bộ dữ liệu trong cột này?`,
        onConfirm: () => {
            const newData = localEmployees.map(item => {
                const newItem = { ...item };
                delete newItem[col];
                return newItem;
            });
            setLocalEmployees(newData);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const handleSave = () => {
    onUpdateEmployees(localEmployees);
    onUpdatePrizes(localPrizes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#002e2c] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="h-16 border-b border-brand-yellow/20 flex items-center justify-between px-6 bg-brand-emeraldDark">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-brand-yellow" />
            Quản lý Dữ liệu
        </h2>
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-teal-200 hover:text-white hover:bg-white/5 rounded-lg transition">Hủy bỏ</button>
            <button onClick={handleSave} className="px-6 py-2 bg-brand-yellow text-brand-emeraldDark font-bold rounded-lg shadow-lg hover:scale-105 transition flex items-center gap-2">
                <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-yellow/10 bg-white/5">
        <button 
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'employees' ? 'bg-brand-emerald text-white border-b-2 border-brand-yellow' : 'text-teal-400 hover:text-white hover:bg-white/5'}`}
        >
            <User className="w-4 h-4" /> Danh sách Cán bộ ({localEmployees.length})
        </button>
        <button 
            onClick={() => setActiveTab('prizes')}
            className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'prizes' ? 'bg-brand-emerald text-white border-b-2 border-brand-yellow' : 'text-teal-400 hover:text-white hover:bg-white/5'}`}
        >
            <Gift className="w-4 h-4" /> Cơ cấu Giải thưởng ({localPrizes.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 flex gap-3 bg-brand-emeraldDark/50 border-b border-white/5">
        <button onClick={addRow} className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600 hover:text-white transition flex items-center gap-2 text-sm font-bold">
            <Plus className="w-4 h-4" /> Thêm dòng mới
        </button>
        {activeTab === 'employees' && (
          <button onClick={addColumn} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600 hover:text-white transition flex items-center gap-2 text-sm font-bold">
              <Plus className="w-4 h-4" /> Thêm cột tùy ý
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <div className="min-w-full inline-block align-middle">
            <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-white/10">
                    {activeTab === 'employees' ? (
                        <>
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider w-12">#</th>
                                    {columns.map(col => (
                                        <th key={col} className="px-4 py-3 text-left text-xs font-medium text-teal-200 uppercase tracking-wider group relative min-w-[150px]">
                                            <div className="flex items-center justify-between">
                                                <span>{col === 'name' ? 'Họ và Tên' : col === 'email' ? 'Email/SBD' : col === 'department' ? 'Phòng ban' : col}</span>
                                                {!['name', 'email'].includes(col) && (
                                                    <button onClick={() => deleteColumn(col)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-white/5">
                                {localEmployees.map((row, rowIndex) => (
                                    <tr key={row.id || rowIndex} className="hover:bg-white/10 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{rowIndex + 1}</td>
                                        {columns.map(col => (
                                            <td key={`${row.id}-${col}`} className="px-4 py-2 whitespace-nowrap">
                                                <input 
                                                    type="text"
                                                    value={row[col] || ''}
                                                    onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-white text-sm placeholder-white/20 p-0"
                                                    placeholder="..."
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => deleteRow(rowIndex)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {localEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-teal-200/50 italic">
                                            Chưa có dữ liệu Cán bộ.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </>
                    ) : (
                        <>
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-brand-yellow uppercase tracking-wider w-12">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-200 uppercase tracking-wider min-w-[200px]">Tên Giải thưởng</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-200 uppercase tracking-wider w-32">Đã trao</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-200 uppercase tracking-wider w-32">Số lượng Còn lại</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-200 uppercase tracking-wider w-40">Tổng Số Lượng</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-white/5">
                                {localPrizes.map((row, rowIndex) => {
                                    const alreadyWon = winners.filter(w => w.prize.id === row.id).length;
                                    const originalQty = typeof row.originalQuantity === 'number' ? row.originalQuantity : (typeof row.quantity === 'number' ? row.quantity : 1);
                                    const remainingQty = Math.max(0, originalQty - alreadyWon);
                                    
                                    return (
                                        <tr key={row.id || rowIndex} className="hover:bg-white/10 transition">
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{rowIndex + 1}</td>
                                            
                                            {/* Name */}
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <input 
                                                    type="text"
                                                    value={row.name || ''}
                                                    onChange={(e) => {
                                                        const newData = [...localPrizes];
                                                        newData[rowIndex].name = e.target.value;
                                                        setLocalPrizes(newData);
                                                    }}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-white text-sm placeholder-white/20 p-0 font-bold"
                                                    placeholder="Tên Giải thưởng..."
                                                />
                                            </td>
                                            
                                            {/* Already Won */}
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-brand-yellow/10 text-brand-yellow rounded-full text-xs font-bold font-mono">
                                                    {alreadyWon}
                                                </span>
                                            </td>
                                            
                                            {/* Remaining */}
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${remainingQty > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {remainingQty}
                                                </span>
                                            </td>
                                            
                                            {/* Total Quantity */}
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    value={originalQty}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                        const newData = [...localPrizes];
                                                        newData[rowIndex].originalQuantity = val;
                                                        newData[rowIndex].quantity = Math.max(0, val - alreadyWon);
                                                        setLocalPrizes(newData);
                                                    }}
                                                    className="w-24 bg-black/30 border border-white/10 rounded px-2 py-1 focus:ring-1 focus:ring-brand-yellow focus:border-brand-yellow text-white text-sm font-mono font-bold"
                                                />
                                            </td>
                                            
                                            {/* Delete */}
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => deleteRow(rowIndex)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {localPrizes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-teal-200/50 italic">
                                            Chưa có cơ cấu Giải thưởng.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </>
                    )}
                </table>
            </div>
        </div>
      </div>
      
      <div className="h-8 bg-brand-emeraldDark text-xs text-teal-200/40 flex items-center justify-center border-t border-white/5">
        Lưu ý: Chỉnh sửa số lượng Tổng sẽ tự động tính toán lại số lượng Còn lại dựa trên danh sách đã trúng thưởng.
      </div>

      {/* Internal Custom Modal to bypass sandbox confirm/alert issues */}
      {confirmModal.isOpen && (
         <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-brand-emeraldDark border border-brand-yellow/30 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                 <div className="flex flex-col items-center text-center gap-4">
                     <div className="p-3 bg-brand-yellow/10 rounded-full text-brand-yellow">
                         <AlertTriangle className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-bold text-white uppercase">{confirmModal.title}</h3>
                     <p className="text-teal-100">{confirmModal.message}</p>
                     <div className="flex gap-4 w-full mt-4">
                         <button 
                             onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                             className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition"
                         >
                             Hủy bỏ
                         </button>
                         <button 
                             onClick={confirmModal.onConfirm}
                             className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg transition"
                         >
                             Xác nhận
                         </button>
                     </div>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default DataManager;
