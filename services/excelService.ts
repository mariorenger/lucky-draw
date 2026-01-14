import * as XLSX from 'xlsx';
import { Employee, Prize, Winner } from '../types';
import { EXCEL_TEMPLATE_EMPLOYEE, EXCEL_TEMPLATE_PRIZE } from '../constants';

export const parseEmployees = (file: File): Promise<Employee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const employees: Employee[] = json.map((row: any, index: number): Employee | null => {
          if (!row['Tên'] && !row['Name']) return null;
          return {
            id: `emp-${index}-${Date.now()}`,
            name: row['Tên'] || row['Name'],
            email: row['Email'] || row['email'] || '',
            department: row['Phòng ban'] || row['Department'] || ''
          };
        }).filter((e): e is Employee => e !== null);

        if (employees.length === 0) throw new Error("No valid employees found. Check columns: 'Tên', 'Email'");
        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parsePrizes = (file: File): Promise<Prize[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const prizes: Prize[] = json.map((row: any, index: number) => {
          const qty = parseInt(row['Số lượng'] || row['Quantity'] || '1', 10);
          if (!row['Tên giải'] && !row['Prize Name']) return null;
          return {
            id: `prize-${index}-${Date.now()}`,
            name: row['Tên giải'] || row['Prize Name'],
            quantity: isNaN(qty) ? 1 : qty,
            originalQuantity: isNaN(qty) ? 1 : qty
          };
        }).filter((p): p is Prize => p !== null);

        resolve(prizes);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const downloadTemplate = (type: 'employee' | 'prize') => {
  const data = type === 'employee' ? EXCEL_TEMPLATE_EMPLOYEE : EXCEL_TEMPLATE_PRIZE;
  const fileName = type === 'employee' ? 'Template_NhanVien.xlsx' : 'Template_GiaiThuong.xlsx';
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
};

export const exportWinners = (winners: Winner[]) => {
  const data = winners.map(w => ({
    "Thời gian": new Date(w.timestamp).toLocaleString(),
    "Tên nhân viên": w.employee.name,
    "Email": w.employee.email,
    "Giải thưởng": w.prize.name,
    "Lời chúc AI": w.aiMessage || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");
  XLSX.writeFile(workbook, "Danh_Sach_Trung_Thuong.xlsx");
};