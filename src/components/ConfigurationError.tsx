import React from 'react';

export const ConfigurationError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl animate-scale-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Not Configured</h1>
          <p className="text-gray-600">Please set up your Supabase credentials to use this app.</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Quick Setup:</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                Create a Supabase project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline font-medium"
                >
                  supabase.com
                </a>
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                Run the <code className="bg-gray-200 px-2 py-1 rounded text-xs">supabase-schema.sql</code> file in
                the SQL editor
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                Create a <code className="bg-gray-200 px-2 py-1 rounded text-xs">.env</code> file with your
                credentials
              </span>
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">Add to .env:</h3>
          <pre className="bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
            {`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzendkZmNidXB1dGduZ25vY3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Mzc2MTgsImV4cCI6MjA4MjAxMzYxOH0.q9QQ_NlQ66Boa5PJ410fvoAiN9LeUGlkm2e05h4cuSk`}
          </pre>
        </div>
      </div>
    </div>
  );
};