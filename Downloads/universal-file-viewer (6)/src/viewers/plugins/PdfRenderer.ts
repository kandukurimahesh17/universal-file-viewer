export const PdfRenderer = {
  render: async (file: any) => {
    console.log('PDF Renderer parsing', file);
    return { success: true, type: 'pdf' };
  }
};
