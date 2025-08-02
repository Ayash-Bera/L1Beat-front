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
  Archive
} from 'lucide-react';
import { ACP } from '../types';
import { acpService } from '../services/acpService';

// Add these interfaces to your types file
interface ACPStats {
  total: number;
  byStatus: Record<string, number>;
  byTrack: Record<string, number>;
  byComplexity: Record<string, number>;
}

interface EnhancedACP extends ACP {
  complexity?: string;
  tags?: string[];
  readingTime?: number;
  abstract?: string;
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
  const [acps, setAcps] = useState<EnhancedACP[]>([]);
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
        
        if (!mounted) return; // Prevent state update if component unmounted
        
        if (acpsData.length === 0) {
          throw new Error('No ACPs found. Make sure the submodule is initialized and the build script has been run.');
        }

        // Convert to EnhancedACP format
        const enhancedACPs: EnhancedACP[] = acpsData.map(acp => ({
          ...acp,
          complexity: acp.complexity || 'Medium',
          tags: acp.tags || [],
          readingTime: Math.max(1, Math.ceil((acp.content?.length || 0) / 1000)),
          abstract: acp.abstract || extractAbstract(acp.content || '')
        }));

        setAcps(enhancedACPs);
        setStats(calculateStats(enhancedACPs));
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
  }, []); // Empty dependency array - only run once

  function extractAbstract(content: string): string {
    // Extract first paragraph that's not a table or header
    const lines = content.split('\n');
    let abstract = '';
    let inTable = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('|')) {
        inTable = true;
        continue;
      }
      
      if (inTable && trimmed.startsWith('#')) {
        inTable = false;
        continue;
      }
      
      if (!inTable && !trimmed.startsWith('#') && trimmed.length > 50) {
        abstract = trimmed.substring(0, 200);
        if (abstract.length === 200) abstract += '...';
        break;
      }
    }
    
    return abstract || 'No abstract available.';
  }

  function calculateStats(acps: EnhancedACP[]): ACPStats {
    const stats: ACPStats = {
      total: acps.length,
      byStatus: {},
      byTrack: {},
      byComplexity: {}
    };

    acps.forEach(acp => {
      // Count by status
      const status = acp.status || 'Unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by track
      const track = acp.track || 'Unknown';
      stats.byTrack[track] = (stats.byTrack[track] || 0) + 1;

      // Count by complexity
      const complexity = acp.complexity || 'Medium';
      stats.byComplexity[complexity] = (stats.byComplexity[complexity] || 0) + 1;
    });

    return stats;
  }

  // Filter and sort ACPs
  const filteredAndSortedACPs = useMemo(() => {
    console.log('Filtering and sorting ACPs...');
    const startTime = performance.now();
    
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
      if (filters.status && acp.status !== filters.status) return false;

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

    const filterTime = performance.now() - startTime;
    console.log(`Filtered to ${filtered.length} ACPs in ${filterTime.toFixed(2)}ms`);
    
    return filtered;
  }, [acps, searchQuery, filters, sortBy, sortOrder]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'final':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft':
      case 'review':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'stagnant':
      case 'withdrawn':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'final':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'draft':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'stagnant':
      case 'withdrawn':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
    }
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
              Loading Avalanche Community Proposals from local data.
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
            {error.includes('submodule') && (
              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Setup Instructions:
                </h3>
                <pre className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
{`# Initialize the submodule:
git submodule update --init --recursive

# Run the build script:
npm run build:acps`}
                </pre>
              </div>
            )}
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

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total ACPs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activated</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.byStatus['Activated'] || stats.byStatus['Final'] || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Review</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(stats.byStatus['Draft'] || 0) + (stats.byStatus['Review'] || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Object.keys(stats.byTrack).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ACPs by title, number, author, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">All Statuses</option>
                      {stats && Object.keys(stats.byStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Track
                    </label>
                    <select
                      value={filters.track}
                      onChange={(e) => setFilters(prev => ({ ...prev, track: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">All Tracks</option>
                      {stats && Object.keys(stats.byTrack).map(track => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Complexity
                    </label>
                    <select
                      value={filters.complexity}
                      onChange={(e) => setFilters(prev => ({ ...prev, complexity: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">All Complexities</option>
                      {stats && Object.keys(stats.byComplexity).map(complexity => (
                        <option key={complexity} value={complexity}>{complexity}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      placeholder="Search by author..."
                      value={filters.author}
                      onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discussion
                    </label>
                    <select
                      value={filters.hasDiscussion === null ? '' : filters.hasDiscussion.toString()}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        hasDiscussion: e.target.value === '' ? null : e.target.value === 'true' 
                      }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">All</option>
                      <option value="true">Has Discussion</option>
                      <option value="false">No Discussion</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredAndSortedACPs.length} of {acps.length} ACPs
            </p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="number">Number</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                  <option value="track">Track</option>
                </select>
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <TrendingUp className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* ACPs Grid/List */}
          {filteredAndSortedACPs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No ACPs Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchQuery || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filters.'
                  : 'No ACPs are available at the moment.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredAndSortedACPs.map((acp) => (
                <div
                  key={acp.number}
                  onClick={() => navigate(`/acps/${acp.number}`)}
                  className={`
                    bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 
                    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer
                    ${viewMode === 'list' ? 'p-4' : 'p-6'}
                  `}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                            ACP-{acp.number}
                          </span>
                          {getStatusIcon(acp.status)}
                        </div>
                        {acp.discussion && (
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {acp.title}
                      </h3>

                      {acp.abstract && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                          {acp.abstract}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(acp.status)}`}>
                          {acp.status}
                        </span>
                        {acp.track && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
                            {acp.track}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {acp.authors?.length ? 
                              acp.authors.length === 1 
                                ? acp.authors[0].name
                                : `${acp.authors[0].name} +${acp.authors.length - 1}`
                              : 'Unknown'
                            }
                          </span>
                        </div>
                        {acp.readingTime && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{acp.readingTime} min read</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                              ACP-{acp.number}
                            </span>
                            {getStatusIcon(acp.status)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {acp.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(acp.status)}`}>
                                {acp.status}
                              </span>
                              {acp.track && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
                                  {acp.track}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                {acp.authors?.length ? 
                                  acp.authors.length === 1 
                                    ? acp.authors[0].name
                                    : `${acp.authors[0].name} +${acp.authors.length - 1}`
                                  : 'Unknown'
                                }
                              </span>
                            </div>
                            {acp.readingTime && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{acp.readingTime}m</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {acp.discussion && (
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          )}
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                        </div>
                      </div>
                    </>
                  )}
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