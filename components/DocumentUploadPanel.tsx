// Painel de Upload de Documentos (RAG - "Informações da Empresa")
import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Tag
} from 'lucide-react';

import { CompanyDocumentService, type CompanyDocument } from '../lib/documentUpload';

interface DocumentUploadPanelProps {
  documents: CompanyDocument[];
  loading: boolean;
}

const CATEGORY_LABELS = {
  services: 'Serviços',
  policies: 'Políticas',
  faq: 'FAQ',
  procedures: 'Procedimentos',
  general: 'Geral'
};

const STATUS_CONFIG = {
  processing: { label: 'Processando', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  documents,
  loading
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para upload
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'general' as keyof typeof CATEGORY_LABELS,
    description: '',
    keywords: [] as string[]
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  // Estados para busca
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const resetUploadForm = () => {
    setUploadForm({
      name: '',
      category: 'general',
      description: '',
      keywords: []
    });
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !uploadForm.keywords.includes(newKeyword.trim())) {
      setUploadForm(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setUploadForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.name) {
        // Pré-popular nome com nome do arquivo
        const fileName = file.name.split('.')[0];
        setUploadForm(prev => ({ ...prev, name: fileName }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await CompanyDocumentService.uploadFile(selectedFile, uploadForm);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setTimeout(() => {
          setIsUploadModalOpen(false);
          resetUploadForm();
          // Recarregar documentos seria feito via callback do parent
        }, 1000);
      } else {
        alert('Erro no upload: ' + result.error);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload: ' + (error as Error).message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await CompanyDocumentService.searchDocuments(
        searchQuery,
        searchCategory || undefined
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${documentName}"?`)) {
      return;
    }

    try {
      await CompanyDocumentService.deleteDocument(documentId);
      // Recarregar documentos seria feito via callback do parent
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      alert('Erro ao deletar documento');
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusBadge = (status: keyof typeof STATUS_CONFIG) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando documentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Informações da Empresa</h3>
          <p className="text-sm text-muted-foreground">
            Faça upload de documentos para melhorar as respostas automáticas
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buscar nos Documentos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Digite sua busca..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} disabled={!searchQuery.trim() || searching}>
                    {searching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Resultados da Busca:</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{result.document_name}</h5>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(result.relevance_score * 100)}% relevante
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {result.content_chunk.substring(0, 200)}...
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Arquivo</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.csv"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos suportados: PDF, DOC, DOCX, TXT, CSV (máx. 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="doc-name">Nome do Documento</Label>
                  <Input
                    id="doc-name"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lista de Serviços 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="doc-category">Categoria</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(value: keyof typeof CATEGORY_LABELS) =>
                      setUploadForm(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doc-description">Descrição (Opcional)</Label>
                  <Textarea
                    id="doc-description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o conteúdo do documento..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Palavras-chave (Opcional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Ex: agendamento, consulta"
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button type="button" onClick={addKeyword}>Adicionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {uploadForm.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      Enviando arquivo... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !uploadForm.name || uploading}
                  >
                    {uploading ? 'Enviando...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upload de documentos para melhorar as respostas da IA
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Primeiro Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <FileText className="h-5 w-5 text-blue-500 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{document.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[document.category as keyof typeof CATEGORY_LABELS]}
                        </Badge>
                        {getStatusBadge(document.status as keyof typeof STATUS_CONFIG)}
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(document.file_size)}
                        </span>
                      </div>

                      {document.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {document.description}
                        </p>
                      )}

                      {document.keywords && document.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {document.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {document.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {document.error_message}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-2">
                        Enviado em {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id, document.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estatísticas */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estatísticas dos Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-medium">{documents.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Prontos:</span>
                <span className="ml-2 font-medium text-green-600">
                  {documents.filter(d => d.status === 'ready').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Processando:</span>
                <span className="ml-2 font-medium text-yellow-600">
                  {documents.filter(d => d.status === 'processing').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Tamanho Total:</span>
                <span className="ml-2 font-medium">
                  {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUploadPanel;