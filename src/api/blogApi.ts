import { config } from '../config';

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    subtitle?: string;  // NEW FIELD
    excerpt: string;
    content: string;
    mainContent?: string;  // NEW FIELD
    author: string;
    publishedAt: string;
    updatedAt: string;
    tags: string[];
    views: number;
    imageUrl?: string;
    readTime?: number;
}

export interface BlogPostsResponse {
    success: boolean;
    data: BlogPost[];
    metadata: {  // Updated from pagination
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
        tag?: string;
        requestId: string;
    };
}

export interface BlogPostResponse {
    success: boolean;
    data: BlogPost;
    metadata: {
        requestId: string;
        retrievedAt: string;
    };
}

export interface BlogHealthResponse {
    success: boolean;
    stats: {
        totalPosts: number;
        syncedPosts: number;  // Updated field name
        recentPosts: number;  // Updated field name
        failedPosts: number;  // Updated field name
        totalViews: number;   // NEW FIELD
        mostRecentPost?: {    // NEW FIELD
            title: string;
            publishedAt: string;
            lastSynced: string;
        };
        healthStatus: string; // NEW FIELD
    };
    lastUpdate: string;
}

export interface BlogTag {
    name: string;
    count: number;
}

export interface BlogTagsResponse {
    success: boolean;
    data: BlogTag[];
}

// Rest of the functions remain the same...
export async function getBlogPosts(
    limit: number = 10,
    offset: number = 0,
    tag?: string
): Promise<BlogPostsResponse> {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });

        if (tag) {
            params.append('tag', tag);
        }

        const response = await fetch(`${config.apiBaseUrl}/api/blog/posts?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw new Error('Failed to fetch blog posts');
    }
}

export async function getBlogPost(slug: string): Promise<BlogPostResponse> {
    try {
        const response = await fetch(`${config.apiBaseUrl}/api/blog/posts/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Blog post not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching blog post ${slug}:`, error);
        throw error;
    }
}

export async function getBlogHealth(): Promise<BlogHealthResponse> {
    try {
        const response = await fetch(`${config.apiBaseUrl}/api/blog/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching blog health:', error);
        throw new Error('Failed to fetch blog health');
    }
}

export async function getBlogTags(): Promise<BlogTagsResponse> {
    try {
        const response = await fetch(`${config.apiBaseUrl}/api/blog/tags`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching blog tags:', error);
        throw new Error('Failed to fetch blog tags');
    }
}

export function calculateReadTime(content: string): number {
    if (!content || typeof content !== 'string') {
        return 1;
    }
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

export function formatBlogDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}