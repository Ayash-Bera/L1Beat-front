import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Tag, ArrowRight } from 'lucide-react';
import { getRelatedPosts, RelatedPost, formatBlogDate } from '../api/blogApi';

interface RelatedArticlesProps {
    currentPostSlug: string;
    limit?: number;
}

export function RelatedArticles({ currentPostSlug, limit = 4 }: RelatedArticlesProps) {
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        return null; // Don't show anything if there's an error or no related posts
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
                    <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                    <Link
                        key={post._id}
                        to={`/blog/${post.slug}`}
                        className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden hover:shadow-lg"
                    >
                        {/* Image */}
                        {post.imageUrl && (
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                            {/* Matching Tags */}
                            {post.matchingTags && post.matchingTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {post.matchingTags.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                    {post.matchingTags.length > 2 && (
                                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full">
                                            +{post.matchingTags.length - 2} more
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Title */}
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
                                {post.title}
                            </h3>

                            {/* Excerpt */}
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                {post.excerpt}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatBlogDate(post.publishedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{post.readTime} min read</span>
                                    </div>
                                </div>

                                {/* Matching indicator */}
                                {post.matchingTagsCount > 0 && (
                                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                                        {post.matchingTagsCount} shared tag{post.matchingTagsCount > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Read more indicator */}
                            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all duration-200">
                                <span>Read article</span>
                                <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}