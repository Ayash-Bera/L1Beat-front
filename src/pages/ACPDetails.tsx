// src/pages/ACPDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
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
import { getHealth } from '../api';
import { HealthStatus } from '../types';
import { acpService, LocalACP } from '../services/acpService';

export default function ACPDetails() {
  const { acpNumber } = useParams<{ acpNumber: string }>();
  const navigate = useNavigate();
  const [acp, setAcp] = useState<LocalACP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchACP() {
      if (!acpNumber || !mounted) return;
      
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading ACP-${acpNumber} from local data...`);
        const [acpData, healthData] = await Promise.all([
          acpService.loadACPByNumber(acpNumber),
          getHealth(),
        ]);
        
        if (!mounted) return;
        
        if (!acpData) {
          setError(`ACP-${acpNumber} not found`);
          return;
        }

        setAcp(acpData);
        setHealth(healthData);
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

  // Custom code component for syntax highlighting
  const CodeBlock = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="rounded-lg"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
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
        <StatusBar health={health} />
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
        <StatusBar health={health} />
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
      <StatusBar health={health} />

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
                  <span className="text-2xl font-mono text-blue-600 dark:text-blue-400 font-bold">
                    ACP-{acp.number}
                  </span>
                  
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  <ReactMarkdown>{acp.title}</ReactMarkdown>
                </h1>

                {/* Authors */}
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {acp.authors?.map((author, index) => (
                      <a
                        key={index}
                        href={`https://github.com/${author.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {author.name}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )) || <span className="text-sm text-gray-600 dark:text-gray-400">Unknown</span>}
                  </div>
                </div>

                

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

          {/* Content with ReactMarkdown */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="prose prose-gray dark:prose-invert max-w-none prose-table:table-auto prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code: CodeBlock
                }}
              >
                {acp.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
