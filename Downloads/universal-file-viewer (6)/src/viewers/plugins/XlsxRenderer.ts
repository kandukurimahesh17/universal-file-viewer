export const XlsxRenderer = {
  render: async (file: any) => {
    console.log('XLSX Renderer parsing', file);
    return { success: true, type: 'xlsx' };
  }
};
