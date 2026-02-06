'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search } from 'lucide-react';
import { OPERATION_CATEGORIES, type DbcOperationType } from '@/lib/dbc/types';

interface OperationPaletteProps {
  onSelect: (type: DbcOperationType) => void;
}

export function OperationPalette({ onSelect }: OperationPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = OPERATION_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  const handleSelect = (type: DbcOperationType) => {
    onSelect(type);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Operation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Operation</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 pr-4">
            {filteredCategories.map((cat) => (
              <div key={cat.name}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat.name}</h4>
                <div className="space-y-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.type}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => handleSelect(item.type)}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No matching operations</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
