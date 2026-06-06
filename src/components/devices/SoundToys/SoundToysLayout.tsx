import * as Icons from 'lucide-react';
import OscilloscopeDrawer from '../../Core/OscilloscopeDrawer/OscilloscopeDrawer';

const SOUND_TOYS_LINKS = [
  {
    category: 'Roland 50 Studio',
    links: [
      { name: 'Roland Synths Studio', url: 'https://roland50.studio/', icon: Icons.Music2 },
    ]
  },
  {
    category: 'Strudel',
    links: [
      { name: 'Strudel.cc REPL', url: 'https://strudel.cc/', icon: Icons.Code2 },
    ]
  },
  {
    category: 'Trackers',
    links: [
      { name: 'BassoonTracker', url: 'https://www.stef.be/bassoontracker/', icon: Icons.AudioLines },
    ]
  },
  {
    category: 'Dittytoy (Code Synths)',
    links: [
      { name: 'Dirty Toy - DT303', url: 'https://dittytoy.net/ditty/0029103012#gate=0.58,tune=-16,pattern=1,waveform=0,cutoff=0.26228,resonance=0.67026,envmod=0.12628,decay=0.78197,overdrive=0.7334,echo=0.44684', icon: Icons.Disc3 },
      { name: 'Dirty Toy - Karplus', url: 'https://dittytoy.net/ditty/827b1b3e63', icon: Icons.Activity },
      { name: 'Dirty Toy - Techno Beat', url: 'https://dittytoy.net/ditty/b3585fb3a3', icon: Icons.Speaker },
      { name: 'Dittytoy - Browse Newest', url: 'https://dittytoy.net/ditty/browse/newest/', icon: Icons.Globe },
    ]
  }
];

export default function SoundToysLayout() {
  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto relative">
      <OscilloscopeDrawer />
      <div className="max-w-5xl mx-auto w-full p-8 space-y-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Icons.Music size={24} className="text-primary" /> Sound Toys
          </h1>
          <p className="text-muted-foreground text-sm">Web-based synthesizers, drum machines, and coding environments.</p>
        </div>

        {SOUND_TOYS_LINKS.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground border-b border-border/50 pb-1.5 uppercase tracking-wider">{section.category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {section.links.map((link, lIdx) => {
                const Icon = link.icon;
                return (
                  <a
                    key={lIdx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-row items-center p-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-muted transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <Icon size={20} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors duration-200 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">{link.name}</span>
                    </div>
                    <Icons.ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
