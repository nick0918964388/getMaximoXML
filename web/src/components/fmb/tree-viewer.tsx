'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Columns3, Zap, Eye, LayoutGrid } from 'lucide-react';
import type { FmbModule, FmbBlock, FmbCanvas } from '@/lib/fmb/types';

interface TreeViewerProps {
  module: FmbModule;
}

export function TreeViewer({ module }: TreeViewerProps) {
  return (
    <div className="text-sm space-y-1">
      <TreeNode label={`Module: ${module.name}`} icon={<Database className="h-4 w-4" />} defaultOpen>
        {module.blocks.length > 0 && (
          <TreeNode label={`Blocks (${module.blocks.length})`} icon={<Columns3 className="h-4 w-4" />} defaultOpen>
            {module.blocks.map((b) => (
              <BlockNode key={b.name} block={b} />
            ))}
          </TreeNode>
        )}
        {module.canvases.length > 0 && (
          <TreeNode label={`Canvases (${module.canvases.length})`} icon={<LayoutGrid className="h-4 w-4" />}>
            {module.canvases.map((c) => (
              <CanvasNode key={c.name} canvas={c} />
            ))}
          </TreeNode>
        )}
        {module.lovs.length > 0 && (
          <TreeNode label={`LOVs (${module.lovs.length})`} icon={<Eye className="h-4 w-4" />}>
            {module.lovs.map((l) => (
              <div key={l.name} className="pl-6 py-0.5 text-muted-foreground">
                {l.name} {l.title && `— ${l.title}`}
              </div>
            ))}
          </TreeNode>
        )}
        {module.triggers.length > 0 && (
          <TreeNode label={`Triggers (${module.triggers.length})`} icon={<Zap className="h-4 w-4" />}>
            {module.triggers.map((t) => (
              <div key={t.name} className="pl-6 py-0.5 text-muted-foreground">
                {t.name}
              </div>
            ))}
          </TreeNode>
        )}
      </TreeNode>
    </div>
  );
}

function BlockNode({ block }: { block: FmbBlock }) {
  return (
    <TreeNode
      label={`${block.name} ${block.singleRecord ? '(single)' : '(multi)'}`}
      icon={<Columns3 className="h-3.5 w-3.5" />}
    >
      {block.items.map((item) => (
        <div key={item.name} className="pl-6 py-0.5 text-muted-foreground">
          <span className="font-mono">{item.name}</span>
          <span className="ml-2 text-xs opacity-70">{item.itemType}</span>
          {item.prompt && <span className="ml-2 text-xs">「{item.prompt}」</span>}
        </div>
      ))}
      {block.triggers.map((t) => (
        <div key={t.name} className="pl-6 py-0.5 text-yellow-600 dark:text-yellow-400">
          ⚡ {t.name}
        </div>
      ))}
    </TreeNode>
  );
}

function CanvasNode({ canvas }: { canvas: FmbCanvas }) {
  return (
    <TreeNode label={`${canvas.name} (${canvas.canvasType})`} icon={<LayoutGrid className="h-3.5 w-3.5" />}>
      {canvas.tabPages.map((tp) => (
        <div key={tp.name} className="pl-6 py-0.5 text-muted-foreground">
          {tp.name} {tp.label && `— ${tp.label}`}
        </div>
      ))}
    </TreeNode>
  );
}

function TreeNode({
  label,
  icon,
  children,
  defaultOpen = false,
}: {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;

  return (
    <div>
      <button
        className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-muted w-full text-left"
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <span className="w-3.5" />
        )}
        {icon}
        <span>{label}</span>
      </button>
      {open && hasChildren && <div className="pl-4">{children}</div>}
    </div>
  );
}
