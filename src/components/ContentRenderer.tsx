// ContentRenderer.tsx - New component for structured content

import React from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface ContentBlock {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
  level?: number;
  items?: string[];
  ordered?: boolean;
  platform?: string;
  language?: string;
}

interface ContentRendererProps {
  blocks: ContentBlock[];
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks }) => {
  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white',
          2: 'text-2xl font-bold mt-10 mb-5 text-gray-900 dark:text-white',
          3: 'text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white',
          4: 'text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white',
          5: 'text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-white',
          6: 'text-sm font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-300'
        };
        return (
          <HeadingTag key={index} className={headingClasses[block.level as keyof typeof headingClasses]}>
            {block.content}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <div 
            key={index}
            className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );

      case 'image':
        return (
          <figure key={index} className="my-12">
            <div className="relative group">
              <img
                src={block.src}
                alt={block.alt}
                className="w-full h-auto rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </div>
            {(block.caption || block.alt) && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4 italic max-w-2xl mx-auto">
                {block.caption || block.alt}
              </figcaption>
            )}
          </figure>
        );

      case 'list':
        const ListTag = block.ordered ? 'ol' : 'ul';
        const listClass = block.ordered ? 'list-decimal' : 'list-disc';
        return (
          <ListTag key={index} className={`my-6 pl-6 space-y-3 ${listClass}`}>
            {block.items?.map((item, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );

      case 'quote':
        return (
          <blockquote 
            key={index}
            className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent pl-8 py-6 my-8 rounded-r-lg relative"
          >
            <div className="absolute top-4 left-2 text-blue-400 text-4xl font-serif">"</div>
            <div 
              className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.content || '' }}
            />
          </blockquote>
        );

      case 'code':
        return (
          <div key={index} className="my-8">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                <span className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  {block.language || 'Code'}
                </span>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-green-400 text-sm font-mono leading-relaxed">
                  {block.content}
                </code>
              </pre>
            </div>
          </div>
        );

      case 'video':
        if (block.platform === 'youtube') {
          return (
            <div key={index} className="my-12">
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl group">
                <iframe
                  src={block.src}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video content"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
          );
        }
        break;

      case 'embed':
        return (
          <div key={index} className="my-8 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <ExternalLink className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-3">External Content</p>
            <a
              href={block.src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Content <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="content-renderer space-y-4">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default ContentRenderer;