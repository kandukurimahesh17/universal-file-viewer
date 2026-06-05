export const CsvRenderer = {
  render: async (file: any) => {
    console.log('CSV Renderer parsing', file);
    return { success: true, type: 'csv' };
  }
};
