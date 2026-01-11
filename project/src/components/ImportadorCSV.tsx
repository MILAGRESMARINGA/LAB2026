import React, { useState } from 'react';
import { Upload, FileText, Users, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  cidade?: string;
  bairro?: string;
  idade?: string;
  intencao?: string;
  tag?: string;
  status: string;
  email?: string;
  observacoes?: string;
}

interface ImportadorCSVProps {
  onImport: (leads: Lead[]) => void;
  onClose: () => void;
}

const ImportadorCSV: React.FC<ImportadorCSVProps> = ({ onImport, onClose }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapeamento inteligente de colunas
  const mapColumns = (headers: string[]) => {
    const mapping: { [key: string]: number } = {};
    
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();
      
      // Mapeamento de nome
      if (normalized.includes('nome') || normalized.includes('name')) {
        mapping.nome = index;
      }
      // Mapeamento de telefone
      else if (normalized.includes('telefone') || normalized.includes('phone') || normalized.includes('celular') || normalized.includes('whatsapp')) {
        mapping.telefone = index;
      }
      // Mapeamento de email
      else if (normalized.includes('email') || normalized.includes('e-mail')) {
        mapping.email = index;
      }
      // Mapeamento de cidade
      else if (normalized.includes('cidade') || normalized.includes('city')) {
        mapping.cidade = index;
      }
      // Mapeamento de bairro
      else if (normalized.includes('bairro') || normalized.includes('neighborhood') || normalized.includes('distrito')) {
        mapping.bairro = index;
      }
      // Mapeamento de idade
      else if (normalized.includes('idade') || normalized.includes('age')) {
        mapping.idade = index;
      }
      // Mapeamento de intenção
      else if (normalized.includes('intencao') || normalized.includes('intenção') || normalized.includes('interesse') || normalized.includes('objetivo')) {
        mapping.intencao = index;
      }
      // Mapeamento de tag
      else if (normalized.includes('tag') || normalized.includes('categoria') || normalized.includes('tipo')) {
        mapping.tag = index;
      }
      // Mapeamento de status
      else if (normalized.includes('status') || normalized.includes('situacao') || normalized.includes('situação')) {
        mapping.status = index;
      }
      // Mapeamento de observações
      else if (normalized.includes('observ') || normalized.includes('nota') || normalized.includes('comment')) {
        mapping.observacoes = index;
      }
    });

    return mapping;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          setError('Arquivo CSV vazio');
          setImporting(false);
          return;
        }

        // Detectar separador (vírgula ou ponto e vírgula)
        const separator = lines[0].includes(';') ? ';' : ',';
        
        // Primeira linha pode ser cabeçalho
        const firstLine = lines[0].split(separator);
        const hasHeader = firstLine.some(col => 
          col.toLowerCase().includes('nome') || 
          col.toLowerCase().includes('telefone') ||
          col.toLowerCase().includes('email')
        );

        let dataLines = lines;
        let mapping: { [key: string]: number } = {};

        if (hasHeader) {
          // Usar mapeamento inteligente
          mapping = mapColumns(firstLine);
          dataLines = lines.slice(1);
        } else {
          // Assumir ordem padrão: nome, telefone, cidade, bairro, idade, intenção, tag, status
          mapping = {
            nome: 0,
            telefone: 1,
            cidade: 2,
            bairro: 3,
            idade: 4,
            intencao: 5,
            tag: 6,
            status: 7
          };
        }

        const importedLeads: Lead[] = dataLines.map((line, index) => {
          const columns = line.split(separator).map(col => col.trim().replace(/"/g, ''));
          
          return {
            id: `imported_${Date.now()}_${index}`,
            nome: columns[mapping.nome] || '',
            telefone: columns[mapping.telefone] || '',
            cidade: columns[mapping.cidade] || '',
            bairro: columns[mapping.bairro] || '',
            idade: columns[mapping.idade] || '',
            intencao: columns[mapping.intencao] || '',
            tag: columns[mapping.tag] || 'Importado',
            status: columns[mapping.status] || 'Novo',
            email: columns[mapping.email] || '',
            observacoes: columns[mapping.observacoes] || ''
          };
        }).filter(lead => lead.nome && lead.telefone); // Filtrar leads com dados essenciais

        setLeads(importedLeads);
        setPreview(true);
        setImporting(false);

      } catch (err) {
        setError('Erro ao processar arquivo CSV. Verifique o formato.');
        setImporting(false);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const confirmImport = () => {
    onImport(leads);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contatado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'agendado': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'fechado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Importar Leads CSV</h2>
              <p className="text-slate-400">Importe seus leads com mapeamento inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!preview ? (
            /* Upload Section */
            <div className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-slate-500 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {importing ? 'Processando...' : 'Selecionar Arquivo CSV'}
                      </h3>
                      <p className="text-slate-400">
                        Clique para selecionar ou arraste o arquivo aqui
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Format Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-medium mb-2">📋 Formatos Aceitos:</h4>
                <div className="space-y-2 text-sm text-blue-300">
                  <p><strong>Com cabeçalho:</strong> O sistema detecta automaticamente as colunas</p>
                  <p><strong>Sem cabeçalho:</strong> Ordem padrão: Nome, Telefone, Cidade, Bairro, Idade, Intenção, Tag, Status</p>
                  <p><strong>Separadores:</strong> Vírgula (,) ou ponto e vírgula (;)</p>
                </div>
              </div>

              {/* Example */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-slate-300 font-medium mb-2">💡 Exemplo de CSV:</h4>
                <code className="text-sm text-green-400 block bg-slate-900/50 p-3 rounded-lg">
                  Nome;Telefone;Cidade;Bairro;Idade;Intenção;Tag;Status<br/>
                  Antonio Silva;44998186163;Maringá;Zona 08;43;Comprar;VIP;Novo<br/>
                  Vanessa Costa;44999887766;Maringá;Zona 07;47;Vender;Premium;Agendado
                </code>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-red-400">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <div>
                    <h3 className="text-green-400 font-bold">Importação Processada</h3>
                    <p className="text-green-300">{leads.length} leads encontrados e prontos para importar</p>
                  </div>
                </div>
              </div>

              {/* Leads Preview */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Preview dos Leads ({leads.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {leads.slice(0, 12).map((lead, index) => (
                    <div key={index} className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-white">{lead.nome}</h4>
                        <p className="text-slate-400 text-sm">{lead.telefone}</p>
                        {lead.email && (
                          <p className="text-slate-400 text-sm">{lead.email}</p>
                        )}
                      </div>
                      
                      {(lead.cidade || lead.bairro) && (
                        <div className="text-sm text-slate-300">
                          {lead.cidade && <span>{lead.cidade}</span>}
                          {lead.cidade && lead.bairro && <span> - </span>}
                          {lead.bairro && <span>{lead.bairro}</span>}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {lead.idade && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                            {lead.idade} anos
                          </span>
                        )}
                        {lead.intencao && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                            {lead.intencao}
                          </span>
                        )}
                        {lead.tag && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30">
                            {lead.tag}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {leads.length > 12 && (
                  <p className="text-slate-400 text-center mt-4">
                    ... e mais {leads.length - 12} leads
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {preview && (
          <div className="flex justify-between items-center p-6 border-t border-slate-700/50 bg-slate-800/50">
            <button
              onClick={() => {
                setPreview(false);
                setLeads([]);
              }}
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Voltar
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Importar {leads.length} Leads</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportadorCSV;