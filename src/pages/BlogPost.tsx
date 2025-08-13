import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';
import parse from 'html-react-parser';
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
import { BlogPost as BlogPostType, getBlogPost, formatBlogDate, calculateReadTime, getRelatedPosts, RelatedPost } from '../api/blogApi';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import { HealthStatus } from '../types';

// HELIUS-STYLE SUBSCRIPTION COMPONENT WITH BETTER TEXT SPACING
// FIXED NEWSLETTER SUBSCRIPTION COMPONENT
const NewsletterSubscription = () => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        
        // Redirect to Substack subscription with pre-filled email
        window.open(`https://l1beat.substack.com/subscribe?email=${encodeURIComponent(email)}`, '_blank');
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
                {/* Left side - Text content - Fixed to prevent text wrapping */}
                <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Subscribe to L1Beat
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                        Stay up-to-date with the latest in Avalanche
                    </p>
                </div>
                
                {/* Right side - Form - Maintain minimum width */}
                <div className="w-full lg:w-auto lg:min-w-[320px]">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            type="email"
                            name="email"
                            placeholder="Type your email..."
                            required
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        />
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 whitespace-nowrap"
                        >
                            Subscribe
                        </button>
                    </form>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center lg:text-left leading-relaxed">
                        By subscribing you agree to{' '}
                        <a href="https://substack.com/terms" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline">
                            Substack's Terms of Use
                        </a>
                        , our{' '}
                        <a href="https://substack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline">
                            Privacy Policy
                        </a>
                        {' '}and our{' '}
                        <a href="https://substack.com/ccpa" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline">
                            Information collection notice
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

// Related Articles Component
const RelatedArticles = ({ currentPostSlug, limit = 4 }: { currentPostSlug: string; limit?: number }) => {
    const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRelatedPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getRelatedPosts(currentPostSlug, limit);
                setRelatedPosts(response.data);
            } catch (err) {
                setError('Failed to load related articles');
                console.error('Error fetching related posts:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentPostSlug) {
            fetchRelatedPosts();
        }
    }, [currentPostSlug, limit]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Related Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: limit }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || relatedPosts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Related Articles
                </h2>
                <Link 
                    to="/blog"
                    className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    View all articles
                    <ArrowLeft className="w-4 h-4 ml-1 transform rotate-180" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                    <Link
                        key={post._id}
                        to={`/blog/${post.slug}`}
                        className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden hover:shadow-lg"
                    >
                        {post.imageUrl && (
                            <div className="relative h-40 overflow-hidden">
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        )}

                        <div className="p-4">
                            {post.matchingTags && post.matchingTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {post.matchingTags.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full"
                                        >
                                            <Tag className="w-2 h-2" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                                {post.title}
                            </h3>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatBlogDate(post.publishedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{post.readTime} min</span>
                                    </div>
                                </div>

                                {post.matchingTagsCount > 0 && (
                                    <div className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                                        {post.matchingTagsCount} shared
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

// Main BlogPost Component
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

        try {
            const blocks = JSON.parse(content);
            return <ContentRenderer blocks={blocks} />;
        } catch (error) {
            const cleanContent = content.trim();
            if (!cleanContent) return null;

            return (
                <div className="prose-content">
                    {parse(cleanContent)}
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
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Blog
                            </button>
                            {error !== 'Post not found' && (
                                <button
                                    onClick={fetchPost}
                                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
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

    if (!post) return null;

    const readTime = post.readTime || calculateReadTime(post.content || '');
    const formattedDate = formatBlogDate(post.publishedAt || '');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            <StatusBar health={health} />

            {/* Back to Blog */}
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
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Subtitle */}
                    {post.subtitle && post.subtitle.trim() && (
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {post.subtitle}
                        </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{readTime} min read</span>
                            </div>
                            {post.author && (
                                <div className="flex items-center gap-2">
                                    <span>By {post.author}</span>
                                </div>
                            )}
                        </div>

                        {/* Share Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>

                            {/* Share Menu */}
                            {shareMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={() => sharePost('twitter')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Twitter className="w-4 h-4" />
                                        Share on Twitter
                                    </button>
                                    <button
                                        onClick={() => sharePost('copy')}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                    <div className="relative mb-12 rounded-xl overflow-hidden">
                        <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-auto max-h-96 object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none dark:prose-invert">
                    {post.mainContent ? (
                        renderMainContent(post.mainContent)
                    ) : post.content ? (
                        renderMainContent(post.content)
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No content available.</p>
                    )}
                </div>

                {/* Original Source Link */}
                {post.sourceUrl && (
                    <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Originally published:</strong>{' '}
                            <a
                                href={post.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium hover:underline"
                            >
                                View on Substack
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </p>
                    </div>
                )}
            </article>

            {/* Divider */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Newsletter Subscription */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <NewsletterSubscription />
            </div>

            {/* Divider */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Related Articles */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <RelatedArticles currentPostSlug={post.slug} limit={3} />
            </div>

            {/* Close on outside click */}
            {shareMenuOpen && (
                <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => setShareMenuOpen(false)}
                />
            )}

            <Footer />
        </div>
    );
}