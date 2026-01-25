// Painel de Upload de Documentos (RAG - "Informações da Empresa")
import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';


import { CompanyDocumentService, type CompanyDocument } from '../lib/documentUpload';

interface DocumentUploadPanelProps {
  documents: CompanyDocument[];
  loading: boolean;
  onRefresh?: () => void;
}

const CATEGORY_LABELS = {
  services: 'Serviços',
  policies: 'Políticas',
  faq: 'FAQ',
  procedures: 'Procedimentos',
  general: 'Geral'
};

const STATUS_CONFIG = {
  processing: { label: 'Processando', color: 'bg-yellow-100 text-yellow-700', icon: 'sync' },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-700', icon: 'check_circle' },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: 'error' }
};

export const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  documents,
  loading,
  onRefresh
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'general' as keyof typeof CATEGORY_LABELS,
    description: '',
    keywords: [] as string[]
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const resetUploadForm = () => {
    setUploadForm({ name: '', category: 'general', description: '', keywords: [] });
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.name) setUploadForm(prev => ({ ...prev, name: file.name.split('.')[0] }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name) return;
    setUploading(true);
    try {
      const result = await CompanyDocumentService.uploadFile(selectedFile, uploadForm);
      if (result.success) {
        setIsUploadModalOpen(false);
        resetUploadForm();
        onRefresh?.();
      }
    } catch (error) {
      alert('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (confirm(`Deletar "${documentName}"?`)) {
      try {
        await CompanyDocumentService.deleteDocument(documentId);
        onRefresh?.();
      } catch (error) {
        alert('Erro ao deletar');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando documentos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Base de Conhecimento</h3>
          <p className="text-sm text-gray-500">Treine sua IA com os documentos da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsSearchModalOpen(true)} icon="search">Buscar</Button>
          <Button onClick={() => setIsUploadModalOpen(true)} icon="cloud_upload">Novo Documento</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {documents.map(doc => (
          <div key={doc.id} className="p-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <span className="material-icons-round text-2xl">description</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded-lg uppercase tracking-tight">
                    {CATEGORY_LABELS[doc.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase ${STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG]?.color}`}>
                    {STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG]?.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleDeleteDocument(doc.id, doc.name)} className="!text-red-500" icon="delete" />
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload de Documento">
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center hover:border-blue-500/30 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt" />
            <span className="material-icons-round text-4xl mx-auto text-gray-300 mb-2">cloud_upload</span>
            <p className="text-sm font-bold text-gray-900">{selectedFile ? selectedFile.name : 'Escolher arquivo'}</p>
            <p className="text-xs text-gray-400">PDF, DOCX ou TXT (Max 10MB)</p>
          </div>

          <Input label="Nome amigável" value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} />

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 uppercase ml-1">Categoria</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value as any })}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!selectedFile || !uploadForm.name}>Fazer Upload</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title="Busca na Base">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input className="flex-1" placeholder="Buscar por termo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Button onClick={() => { }} icon="search">Buscar</Button>
          </div>
          <div className="min-h-[200px] flex items-center justify-center text-gray-400 text-sm italic">
            Resultados da busca aparecerão aqui...
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentUploadPanel;