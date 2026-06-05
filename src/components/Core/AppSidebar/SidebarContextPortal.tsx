import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function SidebarContextPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const container = document.getElementById('sidebar-context-portal-root');
  if (!container) return null;

  return createPortal(children, container);
}
