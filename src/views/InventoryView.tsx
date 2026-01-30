
import React, { useState } from 'react';
import { Medication } from '../types';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';

interface InventoryViewProps {
  medications: Medication[];
  onAddMedication: (med: Omit<Medication, 'id'>) => void;
  onUpdateMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
  showLowStockOnly?: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ medications, onAddMedication, onUpdateMedication, onDeleteMedication, showLowStockOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Medication, 'id'>>({
    name: '', description: '', category: 'Geral', form: 'Comprimido', stock: 0, price: 0, status: 'Em Estoque'
  });

  const filtered = medications.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = showLowStockOnly ? m.stock < 20 : true;
    return matchesSearch && matchesLowStock;
  });

  const handleOpenModal = (med?: Medication) => {
    if (med) {
      setEditingMedId(med.id);
      setFormData({ ...med });
    } else {
      setEditingMedId(null);
      setFormData({ name: '', description: '', category: 'Geral', form: 'Comprimido', stock: 0, price: 0, status: 'Em Estoque' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const status = formData.stock <= 0 ? 'Pedido Solicitado' : formData.stock < 20 ? 'Estoque Baixo' : 'Em Estoque';
    const finalData = { ...formData, status };
    if (editingMedId) {
      onUpdateMedication({ ...finalData, id: editingMedId });
    } else {
      onAddMedication(finalData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Farmácia e Estoque</h1>
          <p className="text-slate-500 text-sm mt-1">{medications.length} itens cadastrados</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primary-dark transition-all">+ Novo Medicamento</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-round text-slate-400">search</span>
            <input type="text" placeholder="Buscar medicamento..." className="w-full pl-10 pr-4 h-11 bg-slate-50 border-transparent rounded-xl text-sm focus:ring-primary focus:bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase border-b bg-slate-50/50">
              <th className="px-6 py-4">Medicamento</th>
              <th className="px-6 py-4">Categoria / Forma</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((med) => (
              <tr key={med.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{med.name.substring(0, 2).toUpperCase()}</div>
                    <div><p className="font-bold text-slate-900 text-sm">{med.name}</p><p className="text-xs text-slate-500">{med.description}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="text-xs font-bold text-slate-600">{med.category}</span><p className="text-[10px] text-slate-400">{med.form}</p></td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${med.status === 'Em Estoque' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {med.stock} UN • {med.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(med)} className="p-2 text-slate-400 hover:text-primary"><span className="material-icons-round text-lg">edit</span></button>
                  <button onClick={() => onDeleteMedication(med.id)} className="p-2 text-slate-400 hover:text-red-500"><span className="material-icons-round text-lg">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMedId ? 'Editar Item' : 'Novo Item'}
        subtitle="Cadastre ou atualize um medicamento"
        icon="medication"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nome do Medicamento"
              required
              placeholder="Nome do Medicamento"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Dosagem / Descrição"
              placeholder="Dosagem / Descrição Curta"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Categoria"
                options={[
                  { value: 'Antibióticos', label: 'Antibióticos' },
                  { value: 'Analgésicos', label: 'Analgésicos' },
                  { value: 'Anti-inflamatório', label: 'Anti-inflamatório' },
                  { value: 'Psicotrópico', label: 'Psicotrópico' },
                  { value: 'Histamínico', label: 'Histamínico' },
                  { value: 'Anti-emético', label: 'Anti-emético' },
                  { value: 'Geral', label: 'Geral' }
                ]}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
              <Select
                label="Forma Famacêutica"
                options={[
                  { value: 'Comprimido', label: 'Comprimido' },
                  { value: 'Cápsula', label: 'Cápsula' },
                  { value: 'Líquido', label: 'Líquido' },
                  { value: 'Injetável', label: 'Injetável' },
                  { value: 'Pomada', label: 'Pomada' },
                  { value: 'Creme', label: 'Creme' },
                  { value: 'Outro', label: 'Outro' }
                ]}
                value={formData.form}
                onChange={e => setFormData({ ...formData, form: e.target.value })}
              />
            </div>
            <Input
              label="Estoque Atual"
              type="number"
              placeholder="Estoque Atual"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg">Salvar Medicamento</button>
        </form>
      </Modal>
    </div>
  );
};
