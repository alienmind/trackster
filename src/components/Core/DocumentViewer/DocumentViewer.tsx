import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { useUIStore } from '../../../stores/useUIStore';
import { useGrindStore } from '../../../stores/useGrindStore';
import { Button } from '../ui/button';
import * as Icons from 'lucide-react';

export default function DocumentViewer() {
  const { activeDoc, setActiveDoc } = useUIStore();
  const activeDocSection = useGrindStore(s => s.activeDocSection);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mdContent, setMdContent] = useState<string>('');

  useEffect(() => {
    if (activeDoc?.type === 'md') {
      fetch(activeDoc.url)
        .then(res => res.text())
        .then(text => setMdContent(text))
        .catch(err => console.error('Failed to load markdown:', err));
    } else {
      setMdContent('');
    }
  }, [activeDoc]);

  // Handle auto-scroll when activeDocSection changes
  useEffect(() => {
    if (activeDocSection && activeDoc?.type === 'md') {
      setTimeout(() => {
        const el = document.getElementById(activeDocSection);
        if (el && scrollRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-cyan-900/40', 'rounded', 'ring-2', 'ring-cyan-500', 'transition-all', 'duration-500');
          setTimeout(() => el.classList.remove('bg-cyan-900/40', 'ring-2', 'ring-cyan-500'), 3000);
        }
      }, 150);
    }
  }, [activeDocSection, activeDoc, mdContent]);

  if (!activeDoc) return null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-card">
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icons.BookOpen size={16} className="text-primary" />
          {activeDoc.type === 'pdf' ? 'PDF Manual' : 'User Guide'}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive transition-colors" onClick={() => setActiveDoc(null)}>
            <Icons.X size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-neutral-900 relative" ref={scrollRef}>
        {activeDoc.type === 'pdf' ? (
          <iframe 
            src={`${activeDoc.url}#view=FitH`} 
            className="w-full h-full border-none"
            title="PDF Manual"
          />
        ) : (
          <div className="p-8 prose prose-invert max-w-3xl mx-auto prose-h1:text-primary prose-a:text-cyan-400 prose-img:rounded-lg prose-headings:font-bold prose-code:text-yellow-200">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSlug]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-black text-cyan-400 mt-6 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-cyan-500 mt-8 mb-4 border-b border-neutral-800 pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold text-neutral-200 mt-6 mb-2 py-1 px-2 -mx-2" {...props} />,
                p: ({node, ...props}) => <p className="text-neutral-400 leading-relaxed mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 text-neutral-400 mb-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                code: ({node, ...props}) => <code className="bg-neutral-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full text-xs text-left" {...props} /></div>,
                th: ({node, ...props}) => <th className="border-b border-neutral-700 bg-neutral-800/50 p-2 font-semibold text-neutral-300" {...props} />,
                td: ({node, ...props}) => <td className="border-b border-neutral-800 p-2 text-neutral-400" {...props} />,
              }}
            >
              {mdContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
