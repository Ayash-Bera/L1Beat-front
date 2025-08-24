import { Chain } from '../types';
import { Activity, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChainListViewProps {
  chains: Chain[];
}

export function ChainListView({ chains }: ChainListViewProps) {
  const navigate = useNavigate();

  const formatTPS = (tps: Chain['tps']) => {
    if (!tps || typeof tps.value !== 'number') return 'N/A';
    return tps.value.toFixed(2);
  };

  const getTPSColor = (tpsStr: string) => {
    if (tpsStr === 'N/A') return 'text-gray-400 dark:text-gray-500';
    const tps = Number(tpsStr);
    if (tps >= 1) return 'text-green-500 dark:text-green-400';
    if (tps >= 0.1) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {chains.map((chain, index) => {
        const tpsValue = formatTPS(chain.tps);
        const tpsColor = getTPSColor(tpsValue);
        
        return (
          <div 
            key={chain.chainId}
            className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out group animate-fade-in"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'both'
            }}
            onClick={() => navigate(`/chain/${chain.chainId}`)}
          >
            <div className="flex items-center gap-3">
              {chain.chainLogoUri ? (
                <img 
                  src={chain.chainLogoUri} 
                  alt={`${chain.chainName} logo`}
                  className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {chain.chainName}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Activity className={`w-3 h-3 ${tpsColor} ${tpsValue !== 'N/A' && Number(tpsValue) > 0 ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-medium ${tpsColor} group-hover:font-bold transition-all duration-300`}>
                      {tpsValue} TPS
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Server className="w-3 h-3 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:font-bold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-300">
                      {chain.validators?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}