import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TPSHistory, NetworkTPS, CumulativeTxCount } from '../types';
import { getTPSHistory, getNetworkTPS, getCumulativeTxCount } from '../api';
import { TrendingUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { MetricsChart, DataPoint } from './MetricsChart';

interface L1MetricsChartProps {
  chainId?: string;
  chainName?: string;
}

type MetricType = 'tps' | 'transactions';
type TimeframeOption = 7 | 14 | 30;

const METRICS = [
  { id: 'tps' as const, name: 'TPS' },
  { id: 'transactions' as const, name: 'Cumulative Transactions' },
];

export function L1MetricsChart({ chainId, chainName }: L1MetricsChartProps) {
  const [tpsHistory, setTpsHistory] = useState<TPSHistory[]>([]);
  const [txHistory, setTxHistory] = useState<CumulativeTxCount[]>([]);
  const [networkTPS, setNetworkTPS] = useState<NetworkTPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tps');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(7);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const promises: Promise<any>[] = [];
        
        if (chainId) {
          promises.push(getTPSHistory(timeframe, chainId));
          promises.push(getCumulativeTxCount(chainId, timeframe));
        } else {
          promises.push(getTPSHistory(timeframe));
          promises.push(getNetworkTPS());
        }

        const [history, secondResult] = await Promise.all(promises);
        
        if (mounted) {
          setTpsHistory(history.sort((a, b) => a.timestamp - b.timestamp));
          if (chainId) {
            setTxHistory(secondResult);
            setNetworkTPS(null);
          } else {
            setNetworkTPS(secondResult);
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [chainId, timeframe]);

  const formatValue = (value: number): string => {
    if (selectedMetric === 'tps') {
      return `${value.toFixed(2)}`;
    }
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const getChartData = (): DataPoint[] => {
    if (selectedMetric === 'tps') {
      return tpsHistory.map(item => ({
        timestamp: item.timestamp,
        value: item.totalTps,
        metadata: {
          chainCount: item.chainCount
        }
      }));
    }
    return txHistory.map(item => ({
      timestamp: item.timestamp,
      value: item.value
    }));
  };

  const tooltipFormatter = (dataPoint: DataPoint): string[] => {
    if (selectedMetric === 'tps') {
      const lines = [`TPS: ${dataPoint.value.toFixed(2)}`];
      if (!chainId && dataPoint.metadata?.chainCount) {
        lines.push(`Active Chains: ${dataPoint.metadata.chainCount}`);
      }
      return lines;
    }
    return [`Transactions: ${dataPoint.value.toLocaleString()}`];
  };

  const latestValue = selectedMetric === 'tps' 
    ? tpsHistory[tpsHistory.length - 1]
    : txHistory[txHistory.length - 1];

  const lastUpdated = latestValue
    ? `Last updated: ${format(new Date(latestValue.timestamp * 1000), 'MMM d, h:mm a')}`
    : undefined;

  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric);
    setIsDropdownOpen(false);
  };

  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
    setLoading(true);
    setError(null);
    
    if (chainId) {
      Promise.all([
        getTPSHistory(newTimeframe, chainId),
        getCumulativeTxCount(chainId, newTimeframe)
      ]).then(([tpsData, txData]) => {
        setTpsHistory(tpsData.sort((a, b) => a.timestamp - b.timestamp));
        setTxHistory(txData);
        setLoading(false);
      }).catch(err => {
        setError('Failed to fetch data');
        setLoading(false);
      });
    } else {
      Promise.all([
        getTPSHistory(newTimeframe),
        getNetworkTPS()
      ]).then(([history, current]) => {
        setTpsHistory(history.sort((a, b) => a.timestamp - b.timestamp));
        setNetworkTPS(current);
        setLoading(false);
      }).catch(err => {
        setError('Failed to fetch data');
        setLoading(false);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Data Accuracy Warning
            </h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
              Due to ongoing backend issues, TPS and transaction data may be temporarily inaccurate. We are working to restore normal service.
            </p>
          </div>
        </div>
      </div>

      <MetricsChart
        title={chainId ? `${chainName || 'Chain'} Metrics` : 'Network-wide Metrics'}
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        data={getChartData()}
        loading={loading}
        error={error}
        onRetry={() => handleTimeframeChange(timeframe)}
        valueFormatter={formatValue}
        valueLabel={selectedMetric === 'tps' ? 'TPS' : ''}
        tooltipFormatter={tooltipFormatter}
        color={{
          line: selectedMetric === 'tps'
            ? 'rgb(99, 102, 241)'
            : 'rgb(202, 138, 4)',
          fill: selectedMetric === 'tps'
            ? 'rgba(99, 102, 241, 0.1)'
            : 'rgba(202, 138, 4, 0.1)'
        }}
        lastUpdated={lastUpdated}
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-dark-700 rounded-full p-1 flex">
              <button
                onClick={() => handleTimeframeChange(7)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timeframe === 7
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => handleTimeframeChange(14)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timeframe === 14
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                14D
              </button>
              <button
                onClick={() => handleTimeframeChange(30)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timeframe === 30
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                30D
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
              >
                {METRICS.find(m => m.id === selectedMetric)?.name}
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-1 z-10"
                >
                  {METRICS.map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => handleMetricChange(metric.id)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        selectedMetric === metric.id
                          ? 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                      }`}
                    >
                      {metric.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
        additionalInfo={
          !chainId && networkTPS && selectedMetric === 'tps' ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Across {networkTPS.chainCount} active chains
            </p>
          ) : undefined
        }
      />
    </div>
  );
}