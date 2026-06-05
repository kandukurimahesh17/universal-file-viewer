export const DocxRenderer = {
  render: async (file: any) => {
    console.log('DOCX Renderer parsing', file);
    return { success: true, type: 'docx' };
  }
};
