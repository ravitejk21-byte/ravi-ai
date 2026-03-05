'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload,
  FileText,
  Trash2,
  Search,
  Loader2,
  BookOpen,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

const documentTypes = [
  { value: 'AUDIT_MANUAL', label: 'Audit Manual' },
  { value: 'ERM_POLICY', label: 'ERM Policy' },
  { value: 'RFP', label: 'RFP Document' },
  { value: 'PRIOR_REPORT', label: 'Prior Report' },
  { value: 'GOVERNANCE_CHARTER', label: 'Governance Charter' },
  { value: 'REGULATORY', label: 'Regulatory Document' },
  { value: 'OTHER', label: 'Other' },
];

export default function KnowledgeBasePage() {
  const { documents, addDocument, deleteDocument } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<{ answer: string; sources: any[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('OTHER');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', docType);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        addDocument(data.document);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsQuerying(true);
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setQueryResult(data);
      }
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-2">
          Upload documents and query them using AI-powered search.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Add documents to your knowledge base for RAG queries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD (Max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Query Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Query Knowledge Base
            </CardTitle>
            <CardDescription>
              Ask questions about your uploaded documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Question</Label>
              <Textarea
                placeholder="e.g., What are the key risk factors mentioned in the audit manual?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleQuery} 
              disabled={!query.trim() || isQuerying}
              className="w-full"
            >
              {isQuerying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Query Documents
                </>
              )}
            </Button>

            {queryResult && (
              <div className="mt-4 space-y-4">
                <Separator />
                <div className="rounded-lg border p-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Answer</h4>
                  <p className="text-sm whitespace-pre-wrap">{queryResult.answer}</p>
                </div>

                {queryResult.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Sources</h4>
                    <div className="space-y-2">
                      {queryResult.sources.map((source, i) => (
                        <div key={i} className="text-xs rounded border p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{source.documentName}</span>
                            <Badge variant="outline">
                              {(source.similarity * 100).toFixed(0)}% match
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload documents to start querying your knowledge base
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{doc.type}</Badge>
                          <span>•</span>
                          <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.isIndexed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Indexed
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
