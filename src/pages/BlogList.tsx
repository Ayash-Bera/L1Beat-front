import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { BlogPost, getBlogPosts, getBlogTags, BlogTag } from '../api/blogApi';
import { BlogCard } from '../components/BlogCard';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import { HealthStatus } from '../types';

export function BlogList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(
        searchParams.get('tag')
    );
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [health] = useState<HealthStatus | null>(null);

    const POSTS_PER_PAGE = 12;

    const fetchPosts = async (offset: number = 0, tag?: string, append: boolean = false) => {
        try {
            if (!append) setLoading(true);
            else setLoadingMore(true);

            const response = await getBlogPosts(POSTS_PER_PAGE, offset, tag || undefined);

            if (append) {
                setPosts(prev => [...prev, ...response.data]);
            } else {
                setPosts(response.data);
            }

            setHasMore(response.metadata.hasMore);
            setError(null);
        } catch (err) {
            setError('Failed to load blog posts. Please try again.');
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await getBlogTags();
            setTags(response.data);
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    };

    useEffect(() => {
        fetchPosts(0, selectedTag || undefined);
        fetchTags();
    }, [selectedTag]);

    const handleTagFilter = (tag: string | null) => {
        setSelectedTag(tag);
        if (tag) {
            setSearchParams({ tag });
        } else {
            setSearchParams({});
        }
    };

    const loadMore = () => {
        fetchPosts(posts.length, selectedTag || undefined, true);
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const featuredPost = filteredPosts[0];
    const regularPosts = filteredPosts.slice(1);

    if (loading && posts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
                <StatusBar health={health} />
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900">
            <StatusBar health={health} />

            <div className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            L1Beat Blog
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                            Insights, analysis, and updates from the Avalanche L1 ecosystem.
                            Stay informed about the latest developments in Layer 1 networks.
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-8 space-y-4">
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tag Filters */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <button
                                    onClick={() => handleTagFilter(null)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${!selectedTag
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                        }`}
                                >
                                    All
                                </button>
                                {tags.map((tag) => (
                                    <button
                                        key={tag.name}
                                        onClick={() => handleTagFilter(tag.name)}
                                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${selectedTag === tag.name
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag.name}
                                        <span className="ml-1 text-xs opacity-75">({tag.count})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <span className="text-red-800 dark:text-red-200">{error}</span>
                                <button
                                    onClick={() => fetchPosts(0, selectedTag || undefined)}
                                    className="ml-auto flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Posts Grid */}
                    {filteredPosts.length > 0 ? (
                        <div className="space-y-8">
                            {/* Featured Post */}
                            {featuredPost && (
                                <div className="mb-12">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Featured Post
                                    </h2>
                                    <BlogCard post={featuredPost} featured />
                                </div>
                            )}

                            {/* Regular Posts Grid */}
                            {regularPosts.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        Latest Posts
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {regularPosts.map((post) => (
                                            <BlogCard key={post._id} post={post} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <div className="text-center pt-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More Posts'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No posts found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {searchTerm || selectedTag
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Check back later for new content.'}
                            </p>
                            {(searchTerm || selectedTag) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        handleTagFilter(null);
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}