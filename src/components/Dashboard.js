import React from 'react';
import Layout from './Layout';

const Dashboard = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center p-4">
        <div className="flex justify-center">
          <img src="/logo_itsup.png" alt="Logo" className="w-96 h-96" />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
