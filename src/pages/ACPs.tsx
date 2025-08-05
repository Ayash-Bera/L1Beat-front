// src/pages/ACPs.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Users,
  Tag,
  BookOpen,
  ChevronDown,
  Star,
  Archive,
  Code,
  AlertCircle
} from 'lucide-react';
import { acpService, LocalACP } from '../services/acpService';

// Simple interfaces for the working version
interface ACPStats {
  total: number;
  byStatus: Record<string, number>;
  byTrack: Record<string, number>;
  byComplexity: Record<string, number>;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'number' | 'title' | 'status' | 'track';
type SortOrder = 'asc' | 'desc';

interface Filters {
  status: string;
  track: string;
  complexity: string;
  author: string;
  hasDiscussion: boolean | null;
}

export default function ACPs() {
  const navigate = useNavigate();
  const [acps, setAcps] = useState<LocalACP[]>([]);
  const [stats, setStats] = useState<ACPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    status: '',
    track: '',
    complexity: '',
    author: '',
    hasDiscussion: null
  });

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);

        console.log('Loading ACPs from local data...');
        const acpsData = await acpService.loadACPs();
        
        if (!mounted) return;
        
        if (acpsData.length === 0) {
          throw new Error('No ACPs found. Make sure the submodule is initialized and the build script has been run.');
        }

        setAcps(acpsData);
        setStats(calculateStats(acpsData));
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading ACPs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ACPs');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const getCleanStatus = (status: string) => {
    if (!status) return 'Unknown';
    // Extracts the primary status from a detailed string.
    // e.g., "Proposed (Last Call - Final Comments)" -> "Proposed"
    // e.g., "Active [ACPs.md]" -> "Active"
    const match = status.match(/^[a-zA-Z]+/);
    return match ? match[0] : 'Unknown';
  };

  function calculateStats(acps: LocalACP[]): ACPStats {
    const stats: ACPStats = {
      total: acps.length,
      byStatus: {},
      byTrack: {},
      byComplexity: {}
    };

    const statusCounts: Record<string, number> = {};

    acps.forEach(acp => {
      const cleanStatus = getCleanStatus(acp.status || 'Unknown');
      statusCounts[cleanStatus] = (statusCounts[cleanStatus] || 0) + 1;

      const track = acp.track || 'Unknown';
      stats.byTrack[track] = (stats.byTrack[track] || 0) + 1;

      const complexity = acp.complexity || 'Medium';
      stats.byComplexity[complexity] = (stats.byComplexity[complexity] || 0) + 1;
    });

    stats.byStatus = statusCounts;
    return stats;
  }

  // Filter and sort ACPs
  const filteredAndSortedACPs = useMemo(() => {
    let filtered = acps.filter(acp => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          acp.title.toLowerCase().includes(query) ||
          acp.number.includes(query) ||
          acp.authors?.some(author => author.name.toLowerCase().includes(query)) ||
          acp.abstract?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && getCleanStatus(acp.status) !== filters.status) return false;

      // Track filter
      if (filters.track && acp.track !== filters.track) return false;

      // Complexity filter
      if (filters.complexity && acp.complexity !== filters.complexity) return false;

      // Author filter
      if (filters.author) {
        const authorMatch = acp.authors?.some(author => 
          author.name.toLowerCase().includes(filters.author.toLowerCase())
        );
        if (!authorMatch) return false;
      }

      // Discussion filter
      if (filters.hasDiscussion !== null) {
        const hasDiscussion = Boolean(acp.discussion);
        if (hasDiscussion !== filters.hasDiscussion) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          comparison = Number(a.number) - Number(b.number);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'track':
          comparison = (a.track || '').localeCompare(b.track || '');
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [acps, searchQuery, filters, sortBy, sortOrder]);

  const getStatusIcon = (status: string) => {
    const cleanStatus = getCleanStatus(status);
    switch (cleanStatus?.toLowerCase()) {
      case 'final':
      case 'active':
      case 'activated':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'draft':
      case 'proposed':
        return <Clock className="w-4 h-4 text-white" />;
      case 'review':
        return <AlertCircle className="w-4 h-4 text-white" />;
      case 'withdrawn':
      case 'rejected':
      case 'stagnant':
      case 'stale':
        return <XCircle className="w-4 h-4 text-white" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    const cleanStatus = getCleanStatus(status);
    switch (cleanStatus?.toLowerCase()) {
      case 'final':
      case 'active':
      case 'activated':
        return 'bg-green-500 text-white';
      case 'draft':
      case 'proposed':
        return 'bg-blue-500 text-white';
      case 'review':
        return 'bg-yellow-500 text-white';
      case 'withdrawn':
      case 'rejected':
      case 'stagnant':
      case 'stale':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      track: '',
      complexity: '',
      author: '',
      hasDiscussion: null
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <StatusBar health={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Loading ACPs...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Processing Avalanche Community Proposals
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <StatusBar health={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load ACPs
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <StatusBar health={null} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Avalanche Community Proposals
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Browse and explore all ACPs in the Avalanche ecosystem.
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ACPs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Final</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(stats.byStatus['Final'] || 0) + (stats.byStatus['Activated'] || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(stats.byStatus['Draft'] || 0) + (stats.byStatus['Review'] || 0) + (stats.byStatus['Proposed'] || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <Code className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Complexity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.byComplexity['High'] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Controls */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search ACPs by title, number, author, or content..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-700 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                    showFilters
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="number-asc">Number (Low to High)</option>
                  <option value="number-desc">Number (High to Low)</option>
                  <option value="title-asc">Title (A to Z)</option>
                  <option value="title-desc">Title (Z to A)</option>
                  <option value="status-asc">Status (A to Z)</option>
                </select>

                <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            {showFilters && stats && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {Object.keys(stats.byStatus).map(status => (
                      <option key={status} value={status}>{status} ({stats.byStatus[status]})</option>
                    ))}
                  </select>

                  <select
                    value={filters.track}
                    onChange={(e) => setFilters({...filters, track: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white"
                  >
                    <option value="">All Tracks</option>
                    {Object.keys(stats.byTrack).map(track => (
                      <option key={track} value={track}>{track} ({stats.byTrack[track]})</option>
                    ))}
                  </select>

                  <select
                    value={filters.complexity}
                    onChange={(e) => setFilters({...filters, complexity: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white"
                  >
                    <option value="">All Complexities</option>
                    {Object.keys(stats.byComplexity).map(complexity => (
                      <option key={complexity} value={complexity}>
                        {complexity} ({stats.byComplexity[complexity]})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Filter by author..."
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white"
                    value={filters.author}
                    onChange={(e) => setFilters({...filters, author: e.target.value})}
                  />

                  <select
                    value={filters.hasDiscussion === null ? '' : filters.hasDiscussion.toString()}
                    onChange={(e) => setFilters({
                      ...filters, 
                      hasDiscussion: e.target.value === '' ? null : e.target.value === 'true'
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-700 dark:text-white"
                  >
                    <option value="">All ACPs</option>
                    <option value="true">With Discussion</option>
                    <option value="false">No Discussion</option>
                  </select>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredAndSortedACPs.length} of {stats.total} ACPs
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {filteredAndSortedACPs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No ACPs found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            }>
              {filteredAndSortedACPs.map((acp) => (
                <div
                  key={acp.number}
                  onClick={() => navigate(`/acps/${acp.number}`)}
                  className={`bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer group ${
                    viewMode === 'list' ? 'p-6' : 'p-6 h-full flex flex-col'
                  }`}
                >
                  <div className={viewMode === 'list' ? 'flex items-start gap-6' : 'flex flex-col h-full'}>
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          ACP-{acp.number}
                        </span>
                        <div className={`flex items-center gap-2 ${getStatusColor(acp.status)} px-3 py-1 rounded-full`}>
                          {getStatusIcon(acp.status)}
                          <span className="text-xs font-medium">
                            {getCleanStatus(acp.status)}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                        {acp.title}
                      </h3>

                      {/* Abstract */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-4 leading-relaxed">
                        {acp.abstract || 'No description available.'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-3">
                          {acp.authors && acp.authors.length > 0 && acp.authors[0].name !== 'Unknown' && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {acp.authors[0].name}
                              {acp.authors.length > 1 && (
                                <span className="text-xs">+ {acp.authors.length - 1} more</span>
                              )}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{acp.readingTime || 5} min read</span>
                          </span>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded ${getComplexityColor(acp.complexity)}`}>
                          {acp.track}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
''