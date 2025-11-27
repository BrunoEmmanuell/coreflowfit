// src/components/ModalNovoAluno.jsx
import { useState } from "react";
import api from "../js/api";

const ModalNovoAluno = ({ onClose, onSucesso }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");

  const locaisLesao = [
    { id: "ombro", label: "Ombros" }, { id: "joelho", label: "Joelhos" },
    { id: "coluna", label: "Coluna / Lombar" }, { id: "pescoco", label: "Pescoço / Cervical" },
    { id: "punho", label: "Punhos / Mãos" }, { id: "cotovelo", label: "Cotovelos" },
    { id: "quadril", label: "Quadril" }, { id: "tornozelo", label: "Tornozelos" }
  ];

  const [lesoesSelecionadas, setLesoesSelecionadas] = useState([]);
  const [form, setForm] = useState({
    nome: "", idade: "", sexo: "Masculino", objetivo: "Hipertrofia",
    nivel: "Iniciante", divisao: "Auto", peso_kg: "", altura_m: "",
    ombros: "", peito: "", cintura: "", quadril: "",
    braco_direito: "", braco_esquerdo: "", coxa_direita: "", coxa_esquerda: "",
    panturrilha_direita: "", panturrilha_esquerda: "",
    hipertensao: false, diabetes: false, cardiopatia: false, fuma: false,
    medicacao: "", observacoes: "", detalhes_lesao: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleLesao = (id) => {
    setLesoesSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- VALIDAÇÃO DE NOME COMPLETO (NOVA) ---
    const nomeLimpo = form.nome.trim();
    if (!nomeLimpo.includes(" ") || nomeLimpo.split(" ").length < 2) {
      alert("⚠️ Nome inválido! Por favor, insira o Nome e Sobrenome do aluno.");
      setActiveTab("dados"); // Foca na aba certa
      // Opcional: focar no input
      document.getElementsByName("nome")[0]?.focus();
      return;
    }

    setLoading(true);
    try {
      let stringLesoes = lesoesSelecionadas.join(", ");
      if (form.detalhes_lesao) stringLesoes += `, ${form.detalhes_lesao}`;

      const payload = {
        ...form,
        nome: nomeLimpo, // Envia o nome validado
        peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
        altura_m: form.altura_m ? parseFloat(form.altura_m) : null,
        
        ombros: form.ombros ? parseFloat(form.ombros) : null,
        peito: form.peito ? parseFloat(form.peito) : null,
        cintura: form.cintura ? parseFloat(form.cintura) : null,
        quadril: form.quadril ? parseFloat(form.quadril) : null,
        
        braco_direito: form.braco_direito ? parseFloat(form.braco_direito) : null,
        braco_esquerdo: form.braco_esquerdo ? parseFloat(form.braco_esquerdo) : null,
        coxa_direita: form.coxa_direita ? parseFloat(form.coxa_direita) : null,
        coxa_esquerda: form.coxa_esquerda ? parseFloat(form.coxa_esquerda) : null,
        panturrilha_direita: form.panturrilha_direita ? parseFloat(form.panturrilha_direita) : null,
        panturrilha_esquerda: form.panturrilha_esquerda ? parseFloat(form.panturrilha_esquerda) : null,

        observacoes: form.observacoes || null,
        lesoes: stringLesoes || null,
        medicacao: form.medicacao || null
      };

      await api.post("/api/v1/alunos/completo", payload);
      alert("Aluno cadastrado com sucesso!");
      onSucesso();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-bold text-white">Novo Aluno</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="flex border-b border-slate-700 bg-slate-800">
          {['dados', 'medidas', 'saude'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-3 text-sm font-medium transition capitalize ${activeTab === tab ? "text-blue-400 border-b-2 border-blue-400 bg-slate-700/50" : "text-slate-400 hover:text-white"}`}>
              {tab === 'dados' ? '👤 Dados' : tab === 'medidas' ? '📏 Medidas' : '❤️ Saúde'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "dados" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-sm mb-1">Nome Completo *</label>
                <input name="nome" value={form.nome} onChange={handleChange} required 
                       className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none" 
                       placeholder="Ex: Bruno Silva" />
                <p className="text-xs text-slate-500 mt-1">Obrigatório: Nome e Sobrenome.</p>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Idade</label>
                <input name="idade" type="number" value={form.idade} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Sexo</label>
                <select name="sexo" value={form.sexo} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none">
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
              <div className="md:col-span-2 bg-blue-900/20 p-3 rounded border border-blue-500/30">
                <label className="block text-blue-200 text-sm mb-1 font-bold">Divisão de Treino</label>
                <select name="divisao" value={form.divisao} onChange={handleChange} className="w-full bg-slate-800 border border-blue-500/50 rounded p-2 text-white outline-none">
                  <option value="Auto">🤖 IA Decide (Recomendado)</option>
                  <option value="FullBody">Full Body</option>
                  <option value="ABC">ABC</option>
                  <option value="ABCDE">ABCDE</option>
                </select>
              </div>
              <div><label className="block text-slate-400 text-sm mb-1">Peso (kg)</label><input name="peso_kg" type="number" step="0.1" value={form.peso_kg} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none" /></div>
              <div><label className="block text-slate-400 text-sm mb-1">Altura (m)</label><input name="altura_m" type="number" step="0.01" value={form.altura_m} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none" /></div>
              <div><label className="block text-slate-400 text-sm mb-1">Objetivo</label><select name="objetivo" value={form.objetivo} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none"><option value="Hipertrofia">Hipertrofia</option><option value="Emagrecimento">Emagrecimento</option><option value="Força">Força</option><option value="Resistência">Resistência</option></select></div>
              <div><label className="block text-slate-400 text-sm mb-1">Nível</label><select name="nivel" value={form.nivel} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none"><option value="Iniciante">Iniciante</option><option value="Intermediario">Intermediário</option><option value="Avancado">Avançado</option></select></div>
            </div>
          )}

          {activeTab === "medidas" && (
            <div className="space-y-6 animate-fadeIn">
               <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200">💡 Preencha em cm.</div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {['ombros', 'peito', 'cintura', 'quadril'].map(f => <div key={f}><label className="text-slate-400 text-xs capitalize">{f}</label><input name={f} type="number" step="0.1" value={form[f]} onChange={handleChange} className="w-full bg-slate-700 rounded p-2 text-white"/></div>)}
                 {['braco_direito', 'braco_esquerdo', 'coxa_direita', 'coxa_esquerda', 'panturrilha_direita', 'panturrilha_esquerda'].map(f => <div key={f}><label className="text-slate-400 text-xs capitalize">{f.replace('_', ' ')}</label><input name={f} type="number" step="0.1" value={form[f]} onChange={handleChange} className="w-full bg-slate-700 rounded p-2 text-white"/></div>)}
               </div>
            </div>
          )}

          {activeTab === "saude" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Condições</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{k:"hipertensao",l:"Hipertensão"},{k:"diabetes",l:"Diabetes"},{k:"cardiopatia",l:"Cardiopatia"},{k:"fuma",l:"Fumante"}].map(c => 
                    <label key={c.k} className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition ${form[c.k]?'bg-red-500/20 border border-red-500/50':'bg-slate-700 hover:bg-slate-600'}`}>
                      <input type="checkbox" name={c.k} checked={form[c.k]} onChange={handleChange} className="form-checkbox h-5 w-5 text-red-500 rounded"/>
                      <span className={form[c.k]?"text-red-200 font-medium":"text-slate-300"}>{c.l}</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Lesões</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {locaisLesao.map(l => 
                    <button key={l.id} type="button" onClick={()=>toggleLesao(l.id)} className={`text-sm py-2 px-3 rounded border transition text-left ${lesoesSelecionadas.includes(l.id)?'bg-orange-500/20 border-orange-500 text-orange-200':'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-600'}`}>
                      {lesoesSelecionadas.includes(l.id)?"✓ ":""}{l.label}
                    </button>
                  )}
                </div>
                <input name="detalhes_lesao" value={form.detalhes_lesao} onChange={handleChange} className="w-full mt-3 bg-slate-700/50 border border-slate-600 rounded p-2 text-white text-sm outline-none" placeholder="Detalhes..." />
              </div>
              <input name="medicacao" value={form.medicacao} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none" placeholder="Medicações..." />
              <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows="2" className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white outline-none" placeholder="Obs Gerais..."></textarea>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-lg shadow-blue-500/30 transition transform hover:scale-105 disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar Aluno"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalNovoAluno;