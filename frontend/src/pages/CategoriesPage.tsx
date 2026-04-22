import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category, CategoryType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CategoryType>('EXPENSE');

  const load = () => api.get<Category[]>('/categories').then(setCategories);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post('/categories', { name: fd.get('name'), type });
      toast.success('Categoria criada');
      setOpen(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Removida');
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categorias</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Receita</SelectItem>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Tipo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/50">
                <td className="p-3">{c.name}</td>
                <td className="p-3">
                  <Badge variant={c.type === 'INCOME' ? 'income' : 'expense'}>
                    {c.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
