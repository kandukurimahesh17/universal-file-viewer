export const ImageRenderer = {
  render: async (file: any) => {
    console.log('Image Renderer parsing', file);
    return { success: true, type: 'image' };
  }
};
