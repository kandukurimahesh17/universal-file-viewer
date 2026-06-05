export const ZipRenderer = {
  render: async (file: any) => {
    console.log('ZIP Renderer parsing', file);
    return { success: true, type: 'zip' };
  }
};
