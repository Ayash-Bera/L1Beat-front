import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  Tag,
  BookOpen,
  Code,
  MessageCircle,
  ArrowRight,
  GitBranch,
  TrendingUp,
  Package,
  Link,
  Calendar,
  Activity
} from 'lucide-react';

// Enhanced ACP Card Component with rich metadata display
const EnhancedACPCard = ({ acp, viewMode = 'grid', onClick }) => {
  // Status configuration
  const getStatusConfig = (status) => {
    const configs = {
      'Activated': { icon: CheckCircle, color: 'green', bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-800 dark:text-green-400' },
      'Implementable': { icon: Package, color: 'blue', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-800 dark:text-blue-400' },
      'Proposed': { icon: Clock, color: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-800 dark:text-yellow-400' },
      'Review': { icon: Clock, color: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-800 dark:text-yellow-400' },
      'Draft': { icon: AlertTriangle, color: 'gray', bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-800 dark:text-gray-400' },
      'Stale': { icon: XCircle, color: 'red', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-400' },
      'Withdrawn': { icon: XCircle, color: 'red', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-400' },
      'Rejected': { icon: XCircle, color: 'red', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-800 dark:text-red-400' },
    };
    return configs[status] || configs['Draft'];
  };

  // Impact level configuration
  const getImpactColor = (impact) => {
    const colors = {
      'Critical': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
      'High': 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10',
      'Medium': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10',
      'Low': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
    };
    return colors[impact] || colors['Medium'];
  };

  // Complexity indicator
  const getComplexityIndicator = (complexity) => {
    const levels = {
      'Low': { bars: 1, color: 'bg-green-500' },
      'Medium': { bars: 2, color: 'bg-yellow-500' },
      'High': { bars: 3, color: 'bg-orange-500' },
      'Very High': { bars: 4, color: 'bg-red-500' },
    };
    const config = levels[complexity] || levels['Medium'];
    
    return (
      <div className="flex gap-0.5 items-center">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-2 w-1 rounded-full ${
              i < config.bars ? config.color : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Implementation status indicator
  const getImplementationStatus = (status) => {
    const statuses = {
      'not-started': { label: 'Not Started', color: 'text-gray-500' },
      'in-progress': { label: 'In Progress', color: 'text-blue-500' },
      'completed': { label: 'Completed', color: 'text-green-500' },
      'deployed': { label: 'Deployed', color: 'text-green-600' },
    };
    return statuses[status] || statuses['not-started'];
  };

  const statusConfig = getStatusConfig(acp.status);
  const StatusIcon = statusConfig.icon;
  const implStatus = getImplementationStatus(acp.implementationStatus);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const statusProgress = {
      'Draft': 10,
      'Review': 25,
      'Proposed': 40,
      'Implementable': 60,
      'Activated': 100,
      'Stale': 0,
      'Withdrawn': 0,
      'Rejected': 0,
    };
    return statusProgress[acp.status] || 0;
  };

  const progressPercentage = getProgressPercentage();

  if (viewMode === 'list') {
    // List view - horizontal layout
    return (
      <div
        onClick={() => onClick(acp)}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* ACP Number and Status */}
            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400">
                ACP-{acp.number}
              </span>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {acp.status}
              </div>
            </div>

            {/* Title and Abstract */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {acp.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {acp.abstract}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {acp.authors?.length || 0}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {acp.readingTime}min
              </div>
              {acp.discussions?.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {acp.discussions.length}
                </div>
              )}
              {acp.codeBlockCount > 0 && (
                <div className="flex items-center gap-1">
                  <Code className="w-4 h-4" />
                  {acp.codeBlockCount}
                </div>
              )}
            </div>

            {/* Impact and Complexity */}
            <div className="flex items-center gap-3">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(acp.impact)}`}>
                {acp.impact} Impact
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Complexity:</span>
                {getComplexityIndicator(acp.complexity)}
              </div>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    );
  }

  // Grid view - card layout
  return (
    <div
      onClick={() => onClick(acp)}
      className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400">
              ACP-{acp.number}
            </span>
            {acp.requires?.length > 0 && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <GitBranch className="w-3 h-3 mr-1" />
                {acp.requires.length}
              </div>
            )}
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {acp.status}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {progressPercentage}% Complete
          </span>
          <span className={`text-xs ${implStatus.color}`}>
            {implStatus.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
          {acp.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-1">
          {acp.abstract}
        </p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span>{acp.authors?.length || 0} authors</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-3 h-3" />
            <span>{acp.readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Tag className="w-3 h-3" />
            <span>{acp.category}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Activity className="w-3 h-3" />
            <span>{acp.track}</span>
          </div>
        </div>

        {/* Impact and Complexity */}
        <div className="flex items-center justify-between mb-3">
          <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(acp.impact)}`}>
            {acp.impact} Impact
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Complexity:</span>
            {getComplexityIndicator(acp.complexity)}
          </div>
        </div>

        {/* Tags */}
        {acp.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {acp.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {acp.tags.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{acp.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {acp.discussions?.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{acp.discussions.length}</span>
              </div>
            )}
            {acp.codeBlockCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Code className="w-4 h-4" />
                <span className="text-xs">{acp.codeBlockCount}</span>
              </div>
            )}
            {acp.externalLinks?.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Link className="w-4 h-4" />
                <span className="text-xs">{acp.externalLinks.length}</span>
              </div>
            )}
          </div>
          
          {acp.updated && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              {new Date(acp.updated).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedACPCard;