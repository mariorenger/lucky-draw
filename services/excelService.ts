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
        
        // Read as array of arrays first to analyze structure
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (!rows || rows.length === 0) {
          throw new Error("File Excel trống hoặc không đọc được dữ liệu.");
        }

        // Filter out completely empty rows
        const validRows = rows.filter(r => r && r.length > 0 && r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ""));
        if (validRows.length === 0) {
          throw new Error("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
        }

        // Determine if first row is a header
        const firstRow = validRows[0];
        const headerTerms = ['tên', 'name', 'mã', 'số', 'sbd', 'ticket', 'stt', 'mnv', 'id', 'phòng', 'ban', 'bộ phận', 'department', 'email', 'thư điện tử', 'hòm thư', 'mail', 'khách hàng', 'customer'];
        
        let hasHeader = false;
        // If there's a strong indicator, or if all items in first row are strings (not pure numbers)
        const firstRowStrings = firstRow.filter(cell => cell !== null && cell !== undefined && isNaN(Number(String(cell).trim())));
        
        // Check if any cell matches our header terms
        const hasHeaderTerm = firstRow.some(cell => {
          if (cell === null || cell === undefined) return false;
          const s = String(cell).trim().toLowerCase();
          return headerTerms.some(term => s.includes(term));
        });

        // If the first row contains header terms or is mostly non-numeric labels, we treat it as header
        if (hasHeaderTerm || (firstRowStrings.length > 0 && firstRow.every(cell => isNaN(Number(cell))))) {
          hasHeader = true;
        }

        let employees: Employee[] = [];

        if (hasHeader) {
          // Parse with headers (existing smart mapping)
          const json = XLSX.utils.sheet_to_json<any>(sheet);
          employees = json.map((row: any, index: number): Employee | null => {
            const nameKeys = ['tên', 'name', 'mã số', 'mã', 'số', 'code', 'sbd', 'ticket', 'stt', 'mã nhân viên', 'mnv', 'id', 'họ và tên', 'họ tên', 'khách hàng', 'customer'];
            let nameVal = '';

            for (const key of nameKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
              if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                nameVal = String(row[foundKey]).trim();
                break;
              }
            }

            if (!nameVal) {
              const firstKey = Object.keys(row)[0];
              if (firstKey && row[firstKey] !== undefined && row[firstKey] !== null) {
                nameVal = String(row[firstKey]).trim();
              }
            }

            if (!nameVal) return null;

            const emailKeys = ['email', 'thư điện tử', 'hòm thư', 'mail'];
            let emailVal = '';
            for (const key of emailKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
              if (foundKey && row[foundKey] !== undefined) {
                emailVal = String(row[foundKey]).trim();
                break;
              }
            }

            const deptKeys = ['phòng ban', 'department', 'phòng', 'ban', 'bộ phận', 'group', 'team', 'đơn vị', 'chức vụ'];
            let deptVal = '';
            for (const key of deptKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
              if (foundKey && row[foundKey] !== undefined) {
                deptVal = String(row[foundKey]).trim();
                break;
              }
            }

            if (!deptVal) {
              if (/^\d+$/.test(nameVal)) {
                deptVal = 'Mã số dự thưởng';
              } else {
                deptVal = 'Thành viên';
              }
            }

            return {
              id: `emp-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: nameVal,
              email: emailVal,
              department: deptVal
            };
          }).filter((e): e is Employee => e !== null);
        } else {
          // No header: raw data rows (e.g., list of IDs or names directly)
          employees = validRows.map((row: any[], index: number): Employee | null => {
            // Find first non-empty cell as Name/ID
            const cells = row.map(c => c !== null && c !== undefined ? String(c).trim() : "");
            const nameVal = cells[0] || cells.find(c => c !== "");
            if (!nameVal) return null;

            // Optional second cell as department
            let deptVal = cells[1] || "";
            // Optional third cell as email
            let emailVal = cells[2] || "";

            // If it's a numeric list and no department, set default label
            if (!deptVal) {
              if (/^\d+$/.test(nameVal)) {
                deptVal = 'Mã số dự thưởng';
              } else {
                deptVal = 'Thành viên';
              }
            }

            return {
              id: `emp-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: nameVal,
              email: emailVal,
              department: deptVal
            };
          }).filter((e): e is Employee => e !== null);
        }

        if (employees.length === 0) throw new Error("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại file Excel.");
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
    "Mã số / Họ tên": w.employee.name,
    "Bộ phận / Phòng ban / Thông tin": w.employee.department || "",
    "Email / Tài khoản": w.employee.email || "",
    "Giải thưởng": w.prize.name,
    "Lời chúc mừng AI": w.aiMessage || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");
  XLSX.writeFile(workbook, "Danh_Sach_Trung_Thuong.xlsx");
};