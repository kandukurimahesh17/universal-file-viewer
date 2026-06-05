export const PptxRenderer = {
  render: async (file: any) => {
    console.log('PPTX Renderer parsing', file);
    return { success: true, type: 'pptx' };
  }
};
