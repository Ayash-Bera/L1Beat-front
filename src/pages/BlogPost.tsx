import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Tag,
    Share2,
    Twitter,
    ExternalLink,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { BlogPost as BlogPostType, getBlogPost, formatBlogDate, calculateReadTime } from '../api/blogApi';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import { HealthStatus } from '../types';

export function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [health] = useState<HealthStatus | null>(null);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);

    useEffect(() => {
        if (!slug) {
            navigate('/blog');
            return;
        }
        fetchPost();
    }, [slug, navigate]);

    const fetchPost = async () => {
        if (!slug) return;

        try {
            setLoading(true);
            setError(null);
            const response = await getBlogPost(slug);
            setPost(response.data);
        } catch (err: any) {
            if (err.message === 'Blog post not found') {
                setError('Post not found');
            } else {
                setError('Failed to load blog post. Please try again.');
            }
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    };

    const sharePost = (platform: 'twitter' | 'copy') => {
        if (!post) return;

        const url = window.location.href;
        const text = `${post.title} - ${post.excerpt}`;

        switch (platform) {
            case 'twitter':
                window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                    '_blank'
                );
                break;
            case 'copy':
                navigator.clipboard.writeText(url).then(() => {
                    setShareMenuOpen(false);
                });
                break;
        }
    };

    const renderMainContent = (content: string | undefined) => {
        if (!content) return null;

        const cleanContent = content.trim();
        if (!cleanContent) return null;

        // Check if content is HTML
        const isHTML = /<[^>]*>/g.test(cleanContent);

        if (isHTML) {
            return (
                <div
                    className="prose prose-lg max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-6 prose-headings:mt-8 prose-headings:mb-4"
                    dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
            );
        } else {
            // Split by double newlines for paragraphs
            const paragraphs = cleanContent
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(p => p.length > 0);

            return (
                <div className="prose prose-lg max-w-none dark:prose-invert">
                    {paragraphs.map((paragraph, index) => (
                        <p key={index} className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300">
                            {paragraph}
                        </p>
                    ))}
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
                <StatusBar health={health} />
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
                <StatusBar health={health} />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {error === 'Post not found' ? 'Post Not Found' : 'Something went wrong'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            {error === 'Post not found'
                                ? "The blog post you're looking for doesn't exist or has been moved."
                                : error
                            }
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/blog')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to Blog
                            </button>
                            {error !== 'Post not found' && (
                                <button
                                    onClick={fetchPost}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return null;
    }

    const readTime = post.readTime || calculateReadTime(post.mainContent || post.content);
    const formattedDate = formatBlogDate(post.publishedAt);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900">
            <StatusBar health={health} />

            <div className="flex-1">
                {/* Navigation */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </div>

                {/* Article */}
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    {/* Header */}
                    <header className="mb-12">
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {post.tags.map((tag) => (
                                    <Link
                                        key={tag}
                                        to={`/blog?tag=${encodeURIComponent(tag)}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Subtitle - NEW */}
                        {post.subtitle && (
                            <h2 className="text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                {post.subtitle}
                            </h2>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-700 pb-6 mb-8">
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{readTime} min read</span>
                                </div>
                                {post.author && (
                                    <div className="font-medium text-gray-700 dark:text-gray-300">
                                        By {post.author}
                                    </div>
                                )}
                            </div>

                            {/* Share */}
                            <div className="relative">
                                <button
                                    onClick={() => setShareMenuOpen(!shareMenuOpen)}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>

                                {shareMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-10">
                                        <button
                                            onClick={() => sharePost('twitter')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                                        >
                                            <Twitter className="w-4 h-4" />
                                            Share on Twitter
                                        </button>
                                        <button
                                            onClick={() => sharePost('copy')}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Copy Link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.imageUrl && (
                        <div className="mb-8">
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
                            />
                        </div>
                    )}

                    {/* Main Content - IMPROVED */}
                    <div className="mb-12">
                        {renderMainContent(post.mainContent || post.content)}
                    </div>

                    {/* Footer */}
                    <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Published on {formattedDate}
                                {post.updatedAt !== post.publishedAt && (
                                    <span className="ml-2">
                                        • Updated {formatBlogDate(post.updatedAt)}
                                    </span>
                                )}
                            </div>

                            {post.views && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {post.views.toLocaleString()} views
                                </div>
                            )}
                        </div>
                    </footer>
                </article>
            </div>

            {/* Click outside to close share menu */}
            {shareMenuOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShareMenuOpen(false)}
                />
            )}

            <Footer />
        </div>
    );
}