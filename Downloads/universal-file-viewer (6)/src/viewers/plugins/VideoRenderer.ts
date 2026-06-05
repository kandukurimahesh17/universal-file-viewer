export const VideoRenderer = {
  render: async (file: any) => {
    console.log('Video Renderer parsing', file);
    return { success: true, type: 'video' };
  }
};
