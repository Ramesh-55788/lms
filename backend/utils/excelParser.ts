import * as xlsx from 'xlsx';

const parseFileToJson = (buffer: Buffer): any[] => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet);
  return jsonData;
};

export default parseFileToJson;
