'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { listStagger, fadeInUp } from '@/lib/motion';
import { tagsService } from '@/features/settings/services/tags.service';

export default function SettingsTagsPage() {
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsService.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tags'] });

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTag.trim();
    if (!name) return;
    try {
      await tagsService.create({ name });
      setNewTag('');
      toast.success('Tag criada');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar tag');
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await tagsService.remove(id);
      toast.success('Tag removida');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">Rótulos para organizar conversas e contatos.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={addTag} className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nova tag (ex: VIP, Suporte)"
            />
            <Button variant="primary" type="submit" disabled={!newTag.trim()}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>

          <motion.div
            variants={listStagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {tags.map((t) => (
              <motion.span
                key={t.id}
                variants={fadeInUp}
                layout
                className="group inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-smooth hover:border-destructive/50"
              >
                {t.name}
                <button
                  onClick={() => deleteTag(t.id)}
                  className="rounded-full p-0.5 text-muted-foreground opacity-0 transition-smooth hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tag criada.</p>
            ) : null}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
