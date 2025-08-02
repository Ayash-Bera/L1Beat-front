import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Tag,
  Clock,
  Github,
  Link as LinkIcon,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { marked } from 'marked';
import { acpService, LocalACP } from '../services/acpService';

export default function ACPDetails() {
  const { acpNumber } = useParams<{ acpNumber: string }>();
  const navigate = useNavigate();
  const [acp, setAcp] = useState<LocalACP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function fetchACP() {
      if (!acpNumber || !mounted) return;
      
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading ACP-${acpNumber} from local data...`);
        const acpData = await acpService.loadACP(acpNumber);
        
        if (!mounted) return;
        
        if (!acpData) {
          setError(`ACP-${acpNumber} not found`);
          return;
        }

        setAcp(acpData);
      } catch (err) {
        if (!mounted) return;
        console.error(`Error loading ACP-${acpNumber}:`, err);
        setError(err instanceof Error ? err.message : `Failed to load ACP-${acpNumber}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchACP();
    
    return () => {
      mounted = false;
    };
  }, [acpNumber]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'final':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'draft':
      case 'review':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'stagnant':
      case 'withdrawn':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'final':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30';
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
      case 'stagnant':
      case 'withdrawn':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
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
              Loading ACP-{acpNumber}...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Fetching proposal details from local data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !acp) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <StatusBar health={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ACP Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error || `ACP-${acpNumber} could not be found.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/acps')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to ACPs
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <StatusBar health={null} />

      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/acps')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ACPs
            </button>
          </div>

          {/* ACP Header */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-mono text-blue-600 dark:text-blue-400">
                    ACP-{acp.number}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(acp.status)}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(acp.status)}`}>
                      {acp.status}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {acp.title}
                </h1>

                {acp.abstract && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {acp.abstract}
                  </p>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Authors */}
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Authors</span>
                      <div className="mt-1">
                        {acp.authors.map((author, index) => (
                          <div key={index} className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                            <span>{author.name}</span>
                            {author.github && (
                              <a
                                href={`https://github.com/${author.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                (@{author.github})
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Track */}
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Track</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
                          {acp.track}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Complexity */}
                  {acp.complexity && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Complexity</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            acp.complexity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                            acp.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          }`}>
                            {acp.complexity}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reading Time */}
                  {acp.readingTime && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Reading Time</span>
                        <div className="mt-1">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {acp.readingTime} min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {acp.tags && acp.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {acp.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  {acp.discussion && (
                    <a
                      href={acp.discussion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      View Discussion
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}

                  <a
                    href={`https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/${acp.folderName || acp.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>

                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ACP Content */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:text-gray-900 dark:prose-headings:text-white
                  prose-p:text-gray-700 dark:prose-p:text-gray-300
                  prose-strong:text-gray-900 dark:prose-strong:text-white
                  prose-a:text-blue-600 dark:prose-a:text-blue-400
                  prose-code:text-gray-900 dark:prose-code:text-gray-100
                  prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                  prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
                  prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                  prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                  prose-table:text-gray-700 dark:prose-table:text-gray-300
                  prose-th:text-gray-900 dark:prose-th:text-white
                  prose-td:border-gray-300 dark:prose-td:border-gray-600
                  prose-th:border-gray-300 dark:prose-th:border-gray-600"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(acp.content, {
                    breaks: true,
                    gfm: true
                  })
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}