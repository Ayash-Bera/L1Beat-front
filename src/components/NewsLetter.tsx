import React from 'react';

// Helius-style subscription component
const Newsletter = () => (
    <div className="bg-gray-900 rounded-xl p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Text content */}
            <div>
                <h3 className="text-3xl font-bold text-white mb-4">
                    Subscribe to L1Beat
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                    Stay up-to-date with the latest in Avalanche development and receive updates when we post
                </p>
            </div>
            
            {/* Right side - Form */}
            <div className="flex flex-col items-center lg:items-end">
                <div className="w-full max-w-sm">
                    <div className="flex gap-3 mb-4">
                        <input
                            type="email"
                            placeholder="Type your email..."
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            Subscribe
                        </button>
                    </div>
                    
                    <p className="text-xs text-gray-400 text-center lg:text-right">
                        By subscribing you agree to{' '}
                        <a href="https://substack.com/terms" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white underline">
                            Substack's Terms of Use
                        </a>
                        , our{' '}
                        <a href="https://substack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white underline">
                            Privacy Policy
                        </a>
                        {' '}and our{' '}
                        <a href="https://substack.com/ccpa" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white underline">
                            Information collection notice
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default Newsletter;