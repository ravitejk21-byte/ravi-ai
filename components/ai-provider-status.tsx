'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Bot,
  Sparkles,
  Cpu,
  Zap,
  ExternalLink
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  available: boolean;
  freeTier: boolean;
  supportsEmbeddings: boolean;
  chatModel: string;
  embeddingModel?: string;
  isCurrent: boolean;
}

interface ProviderStatus {
  providers: Provider[];
  currentProvider: string;
  hasAnyProvider: boolean;
  hasEmbeddingProvider: boolean;
  setupComplete: boolean;
  suggestions: string[];
  warnings: string[];
}

export function AIProviderStatus() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/providers');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const testProvider = async (providerId: string, type: 'chat' | 'embedding' = 'chat') => {
    setTesting(providerId);
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, type }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${providerId} test successful!\n\nModel: ${data.model}\nResponse: ${data.response?.slice(0, 100)}...`);
      } else {
        alert(`❌ ${providerId} test failed:\n${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Test failed: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Provider Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking providers...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Provider Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            Failed to load provider status
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'openai': return <Sparkles className="h-4 w-4" />;
      case 'groq': return <Zap className="h-4 w-4" />;
      case 'ollama': return <Cpu className="h-4 w-4" />;
      case 'together': return <Bot className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Provider Status
        </CardTitle>
        <CardDescription>
          Configure and monitor your AI providers. At least one provider is required for AI features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center gap-4">
          {status.setupComplete ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium text-green-600">All Systems Operational</p>
                <p className="text-sm text-muted-foreground">
                  Current provider: <Badge variant="outline">{status.currentProvider}</Badge>
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium text-amber-600">Setup Incomplete</p>
                <p className="text-sm text-muted-foreground">Configure at least one AI provider</p>
              </div>
            </>
          )}
          <Button variant="outline" size="sm" onClick={fetchStatus} className="ml-auto">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>

        <Separator />

        {/* Provider List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Configured Providers</h4>
          {status.providers.map((provider) => (
            <div
              key={provider.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                provider.isCurrent ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                {getProviderIcon(provider.id)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {provider.freeTier && (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                    {provider.isCurrent && (
                      <Badge className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chat: {provider.chatModel}
                    {provider.supportsEmbeddings && provider.embeddingModel && (
                      <> · Embeddings: {provider.embeddingModel}</>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {provider.available ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testProvider(provider.id)}
                      disabled={testing === provider.id}
                    >
                      {testing === provider.id ? 'Testing...' : 'Test'}
                    </Button>
                  </>
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Warnings */}
        {status.warnings.length > 0 && (
          <div className="space-y-2">
            {status.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {status.suggestions.length > 0 && (
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium">Setup Suggestions</h4>
            <ul className="space-y-2 text-sm">
              {status.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  {suggestion}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <a href="/FREE_SETUP.md" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Setup Guide
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}