import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, User } from 'lucide-react';
import { toast } from 'sonner';

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => api.get<Member[]>('/members').then(setMembers);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post('/members', { name: fd.get('name') });
      toast.success('Membro adicionado');
      setOpen(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/members/${id}`);
      toast.success('Removido');
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="hidden md:block text-2xl font-bold">Membros</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo membro</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input name="name" required />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium">{m.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
