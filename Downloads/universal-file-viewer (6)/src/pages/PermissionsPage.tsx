import React from 'react';

export const PermissionsPage: React.FC = () => {
  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Permissions</h1>
      <p>Storage permission, Notification permission, Camera permission, Microphone permission.</p>
    </div>
  );
};

export default PermissionsPage;
