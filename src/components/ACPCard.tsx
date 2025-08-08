import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Users,
  Clock,
  GitBranch,
  TrendingUp,
  Package,
  ArrowRight,
  BookOpen,
  Tag,
  Activity,
  MessageCircle,
  Code,
  Link,
  Calendar
} from 'lucide-react';

const EnhancedACPCard = ({ acp, viewMode = 'grid', onClick }) => {
  const getImpactColor = (impact) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      'Low': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return colors[impact] || colors['Medium'];
  };

  const getComplexityIndicator = (complexity) => {
    const levels = {
      'Low': { bars: 1, color: 'bg-green-500' },
      'Medium': { bars: 2, color: 'bg-yellow-500' },
      'High': { bars: 3, color: 'bg-orange-500' },
      'Very High': { bars: 4, color: 'bg-red-500' },
    };
    const config = levels[complexity] || levels['Medium'];

    return (
      <div className="flex items-center gap-1" title={`Complexity: ${complexity}`}>
        <span className="text-xs text-gray-500 dark:text-gray-400">Complexity:</span>
        <div className="flex gap-0.5 items-center">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-2 w-1.5 rounded-full ${
                i < config.bars ? config.color : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const MetadataItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
      {value && <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{value}</span>}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(acp)}
        className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                ACP-{acp.number}
              </span>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <ReactMarkdown>{acp.title}</ReactMarkdown>
              </h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              <ReactMarkdown>{acp.abstract}</ReactMarkdown>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <MetadataItem icon={Users} label={`${acp.authors?.length || 0} authors`} />
                <MetadataItem icon={BookOpen} label={`${acp.readingTime} min read`} />
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getImpactColor(acp.impact)}`}>
                  {acp.impact} Impact
                </span>
                {getComplexityIndicator(acp.complexity)}
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(acp)}
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group h-full flex flex-col"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            ACP-{acp.number}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getImpactColor(acp.impact)}`}>
            {acp.impact} Impact
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-tight">
          <ReactMarkdown>{acp.title}</ReactMarkdown>
        </h3>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4 leading-relaxed">
          <ReactMarkdown>{acp.abstract}</ReactMarkdown>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">{acp.authors?.length || 0} authors</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">{acp.readingTime} min read</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>
              {acp.track}
            </span>
            <span className={`px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>
              {acp.category}
            </span>
          </div>
          {getComplexityIndicator(acp.complexity)}
        </div>
      </div>
    </div>
  );
};

export default EnhancedACPCard;
