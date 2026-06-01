import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { useGrindStore } from '../../stores/useGrindStore';
import grindDocUrl from '@doc/GRIND.md?url';

export default function GrindNavigator() {
  const activeDocSection = useGrindStore(s => s.activeDocSection);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [grindDoc, setGrindDoc] = useState<string>('');

  useEffect(() => {
    fetch(grindDocUrl)
      .then(r => r.text())
      .then(setGrindDoc)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeDocSection && scrollRef.current) {
      setTimeout(() => {
        // Find the element by ID
        const el = scrollRef.current?.querySelector(`#${activeDocSection}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Apply a highlight effect
          el.classList.add('bg-cyan-900/40', 'rounded', 'ring-2', 'ring-cyan-500', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('bg-cyan-900/40', 'ring-2', 'ring-cyan-500');
          }, 3000);
        }
      }, 50);
    }
  }, [activeDocSection]);

  return (
    <div className="w-96 bg-card border-l border-border h-full flex flex-col z-10 overflow-hidden shrink-0 shadow-2xl">
      <div className="p-4 border-b border-border/50 bg-black/40 shrink-0">
        <h2 className="text-lg font-bold text-foreground">Grind Manual</h2>
        <p className="text-xs text-muted-foreground mt-1">Interact with controls on the device to automatically jump to their documentation.</p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none custom-scrollbar pb-32">
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
          {grindDoc}
        </ReactMarkdown>
      </div>
    </div>
  );
}
