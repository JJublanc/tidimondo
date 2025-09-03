'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { Components } from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Composants personnalisés pour le rendu Markdown
const components: Components = {
  // Images avec Next.js Image optimisé
  img: ({ src, alt, ...props }) => {
    if (!src || typeof src !== 'string') return null
    
    return (
      <div className="relative w-full my-6">
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={400}
          className="rounded-lg object-cover w-full h-auto"
        />
      </div>
    )
  },
  
  // Liens avec Next.js Link pour les liens internes
  a: ({ href, children, ...props }) => {
    if (!href) return <span {...props}>{children}</span>
    
    // Lien interne
    if (href.startsWith('/') || href.startsWith('#')) {
      return (
        <Link 
          href={href} 
          className="text-green-600 hover:text-green-700 underline font-medium"
          {...props}
        >
          {children}
        </Link>
      )
    }
    
    // Lien externe
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-700 underline font-medium"
        {...props}
      >
        {children}
      </a>
    )
  },
  
  // Titres avec des styles personnalisés
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2" {...props}>
      {children}
    </h1>
  ),
  
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold text-gray-900 mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),
  
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props}>
      {children}
    </h4>
  ),
  
  // Paragraphes
  p: ({ children, ...props }) => (
    <p className="text-gray-700 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  
  // Listes
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  
  li: ({ children, ...props }) => (
    <li className="text-gray-700" {...props}>
      {children}
    </li>
  ),
  
  // Citations
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-4 italic text-gray-600 bg-green-50 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  ),
  
  // Code
  code: ({ children, className, ...props }) => {
    const isInline = !className
    
    if (isInline) {
      return (
        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    }
    
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  
  // Blocs de code
  pre: ({ children, ...props }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm" {...props}>
      {children}
    </pre>
  ),
  
  // Tableaux
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50" {...props}>
      {children}
    </thead>
  ),
  
  tbody: ({ children, ...props }) => (
    <tbody className="bg-white divide-y divide-gray-200" {...props}>
      {children}
    </tbody>
  ),
  
  th: ({ children, ...props }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props}>
      {children}
    </td>
  ),
  
  // Séparateurs
  hr: (props) => (
    <hr className="border-t border-gray-200 my-8" {...props} />
  ),
  
  // Emphases
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-gray-900" {...props}>
      {children}
    </strong>
  ),
  
  em: ({ children, ...props }) => (
    <em className="italic text-gray-700" {...props}>
      {children}
    </em>
  ),
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        skipHtml={false}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}