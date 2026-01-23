// Sistema de Upload de Documentos (RAG - "Informações da Empresa")
import React from 'react';
import { supabase } from './supabase';

// Types para documentos da empresa
interface CompanyDocument {
  id: string;
  tenant_id: string;
  name: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  content_text?: string; // Texto extraído para RAG
  content_chunks?: string[]; // Chunks para vetorização
  status: 'processing' | 'ready' | 'error';
  error_message?: string;
  category: 'services' | 'policies' | 'faq' | 'procedures' | 'general';
  description?: string;
  keywords?: string[];
  active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface DocumentUploadResult {
  success: boolean;
  document?: CompanyDocument;
  error?: string;
}

interface DocumentSearchResult {
  document_id: string;
  document_name: string;
  content_chunk: string;
  relevance_score: number;
}

// Classe para gerenciar documentos da empresa (RAG)
export class CompanyDocumentService {

  /**
   * 📁 Upload de arquivo para storage do Supabase
   */
  static async uploadFile(
    file: File,
    metadata: {
      name: string;
      category: 'services' | 'policies' | 'faq' | 'procedures' | 'general';
      description?: string;
      keywords?: string[];
    }
  ): Promise<DocumentUploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use PDF, DOC, DOCX, TXT ou CSV.');
      }

      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 10MB.');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.tenant_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload para storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Extrair texto do arquivo
      let contentText = '';
      try {
        contentText = await this.extractTextFromFile(file);
      } catch (error) {
        console.warn('Erro ao extrair texto:', error);
        // Continuar mesmo sem extração de texto
      }

      // Salvar registro no banco
      const { data: documentData, error: dbError } = await supabase
        .from('company_documents')
        .insert({
          tenant_id: userData.tenant_id,
          name: metadata.name,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: uploadData.path,
          content_text: contentText,
          category: metadata.category,
          description: metadata.description,
          keywords: metadata.keywords || [],
          status: contentText ? 'ready' : 'processing',
          created_by: user.id,
          updated_by: user.id,
          active: true
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: deletar arquivo do storage
        await supabase.storage
          .from('company-documents')
          .remove([uploadData.path]);
        throw dbError;
      }

      // Processar chunks para RAG em background
      if (contentText) {
        this.processDocumentChunks(documentData.id, contentText);
      }

      return {
        success: true,
        document: documentData
      };

    } catch (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no upload'
      };
    }
  }

  /**
   * 📝 Extrair texto de diferentes tipos de arquivo
   */
  private static async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      return await file.text();
    }

    if (file.type === 'application/pdf') {
      // Para PDFs, precisaríamos de uma biblioteca como pdf-parse
      // Por enquanto, retornar placeholder
      return `[PDF] ${file.name} - Processamento de texto em desenvolvimento`;
    }

    if (file.type.includes('word')) {
      // Para DOCs, precisaríamos de mammoth.js ou similar
      return `[DOC] ${file.name} - Processamento de texto em desenvolvimento`;
    }

    throw new Error('Tipo de arquivo não suportado para extração de texto');
  }

  /**
   * 🔍 Processar texto em chunks para RAG
   */
  private static async processDocumentChunks(documentId: string, text: string): Promise<void> {
    try {
      // Dividir texto em chunks de ~500 caracteres com sobreposição
      const chunks = this.createTextChunks(text, 500, 50);

      // Salvar chunks no banco
      await supabase
        .from('company_documents')
        .update({
          content_chunks: chunks,
          status: 'ready'
        })
        .eq('id', documentId);

    } catch (error) {
      console.error('Erro ao processar chunks:', error);

      // Marcar como erro no banco
      await supabase
        .from('company_documents')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Erro no processamento'
        })
        .eq('id', documentId);
    }
  }

  /**
   * ✂️ Criar chunks de texto com sobreposição
   */
  private static createTextChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  /**
   * 📋 Listar documentos do tenant
   */
  static async listTenantDocuments(): Promise<CompanyDocument[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  /**
   * 🔍 Buscar informações nos documentos (RAG)
   */
  static async searchDocuments(
    query: string,
    category?: 'services' | 'policies' | 'faq' | 'procedures' | 'general',
    limit: number = 5
  ): Promise<DocumentSearchResult[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Busca básica por texto (sem vetorização por enquanto)
      let queryBuilder = supabase
        .from('company_documents')
        .select('id, name, content_text, content_chunks, category')
        .eq('tenant_id', userData.tenant_id)
        .eq('status', 'ready')
        .eq('active', true);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data: documents, error } = await queryBuilder;

      if (error) throw error;
      if (!documents || documents.length === 0) return [];

      // Busca simples por similaridade de texto
      const results: DocumentSearchResult[] = [];
      const searchTerms = query.toLowerCase().split(/\s+/);

      documents.forEach(doc => {
        if (doc.content_chunks && Array.isArray(doc.content_chunks)) {
          doc.content_chunks.forEach((chunk: string) => {
            const chunkLower = chunk.toLowerCase();
            const score = this.calculateSimpleRelevance(searchTerms, chunkLower);

            if (score > 0.1) { // Threshold mínimo
              results.push({
                document_id: doc.id,
                document_name: doc.name,
                content_chunk: chunk,
                relevance_score: score
              });
            }
          });
        } else if (doc.content_text) {
          // Se não tem chunks, usar texto completo
          const textLower = doc.content_text.toLowerCase();
          const score = this.calculateSimpleRelevance(searchTerms, textLower);

          if (score > 0.1) {
            results.push({
              document_id: doc.id,
              document_name: doc.name,
              content_chunk: doc.content_text.substring(0, 500) + '...',
              relevance_score: score
            });
          }
        }
      });

      // Ordenar por relevância e limitar resultados
      return results
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);

    } catch (error) {
      console.error('Erro na busca de documentos:', error);
      return [];
    }
  }

  /**
   * 🎯 Calcular relevância simples (sem embeddings)
   */
  private static calculateSimpleRelevance(searchTerms: string[], text: string): number {
    let score = 0;
    const textWords = text.split(/\s+/);

    searchTerms.forEach(term => {
      const termCount = textWords.filter(word =>
        word.includes(term) || term.includes(word)
      ).length;

      score += termCount / textWords.length;
    });

    return Math.min(score, 1); // Max score = 1
  }

  /**
   * 🗑️ Deletar documento
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // Buscar documento para obter path do arquivo
      const { data: doc, error: docError } = await supabase
        .from('company_documents')
        .select('file_path')
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (docError) throw docError;

      // Deletar arquivo do storage
      if (doc.file_path) {
        await supabase.storage
          .from('company-documents')
          .remove([doc.file_path]);
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id);

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  /**
   * ✏️ Atualizar documento
   */
  static async updateDocument(id: string, updates: Partial<{
    name: string;
    category: string;
    description: string;
    keywords: string[];
    active: boolean;
  }>): Promise<CompanyDocument> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('company_documents')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', userData.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  /**
   * 📊 Obter estatísticas dos documentos
   */
  static async getDocumentStats(): Promise<{
    total: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
    total_size_mb: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('company_documents')
        .select('category, status, file_size')
        .eq('tenant_id', userData.tenant_id);

      if (error) throw error;
      if (!data) return { total: 0, by_category: {}, by_status: {}, total_size_mb: 0 };

      const stats = {
        total: data.length,
        by_category: {} as Record<string, number>,
        by_status: {} as Record<string, number>,
        total_size_mb: 0
      };

      data.forEach(doc => {
        // Por categoria
        stats.by_category[doc.category] = (stats.by_category[doc.category] || 0) + 1;

        // Por status
        stats.by_status[doc.status] = (stats.by_status[doc.status] || 0) + 1;

        // Tamanho total
        stats.total_size_mb += doc.file_size / (1024 * 1024);
      });

      stats.total_size_mb = Math.round(stats.total_size_mb * 100) / 100; // 2 casas decimais

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, by_category: {}, by_status: {}, total_size_mb: 0 };
    }
  }
}

// Hook React para usar documentos da empresa
export const useCompanyDocuments = () => {
  const [documents, setDocuments] = React.useState<CompanyDocument[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await CompanyDocumentService.listTenantDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    metadata: {
      name: string;
      category: 'services' | 'policies' | 'faq' | 'procedures' | 'general';
      description?: string;
      keywords?: string[];
    }
  ) => {
    setUploading(true);
    try {
      const result = await CompanyDocumentService.uploadFile(file, metadata);
      if (result.success) {
        await loadDocuments(); // Recarregar lista
      }
      return result;
    } finally {
      setUploading(false);
    }
  };

  const searchDocuments = async (query: string, category?: string) => {
    return await CompanyDocumentService.searchDocuments(
      query,
      category as any,
      10
    );
  };

  React.useEffect(() => {
    loadDocuments();
  }, []);

  return {
    documents,
    loading,
    uploading,
    loadDocuments,
    uploadDocument,
    searchDocuments,
    deleteDocument: CompanyDocumentService.deleteDocument,
    updateDocument: CompanyDocumentService.updateDocument
  };
};

// Export tipos
export type { CompanyDocument, DocumentUploadResult, DocumentSearchResult };