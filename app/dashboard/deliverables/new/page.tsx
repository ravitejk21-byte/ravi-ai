'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sparkles, Download, Copy, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function NewDeliverablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get('prompt');
  const { prompts, engagements, addDeliverable } = useAppStore();

  const [selectedPromptId, setSelectedPromptId] = useState<string>(promptId || '');
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [deliverableName, setDeliverableName] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [streamedContent, setStreamedContent] = useState('');

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  useEffect(() => {
    if (selectedPrompt) {
      const defaults: Record<string, string> = {};
      selectedPrompt.variables.forEach((v) => {
                defaults[v.name] = v.default || '';
      });
      setVariableValues(defaults);
      if (!deliverableName) {
        setDeliverableName(`${selectedPrompt.name} - ${new Date().toLocaleDateString()}`);
      }
    }
  }, [selectedPrompt, deliverableName]);

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  };

  const processTemplate = (template: string, values: Record<string, string>): string => {
    let result = template;
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  const simulateGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setStreamedContent('');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // Simulate streaming
    const template = selectedPrompt?.template || '';
    const processedTemplate = processTemplate(template, variableValues);
    
    // Simulate AI generation with chunks
    const chunks = processedTemplate.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < chunks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      currentContent += chunks[i] + ' ';
      setStreamedContent(currentContent);
    }

    clearInterval(progressInterval);
    setGenerationProgress(100);
    setGeneratedContent(currentContent);
    setIsGenerating(false);

    // Save deliverable
    const newDeliverable = {
      id: uuidv4(),
      engagementId: selectedEngagementId || 'unassigned',
      name: deliverableName,
      type: 'custom' as const,
      status: 'draft' as const,
      promptId: selectedPromptId,
      variables: variableValues,
      content: currentContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addDeliverable(newDeliverable);
    toast.success('Deliverable generated successfully');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedContent || generatedContent);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    const content = streamedContent || generatedContent;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deliverableName || 'deliverable'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded as Markdown');
  };

  const canGenerate = selectedPromptId && deliverableName && 
    selectedPrompt?.variables.every((v) => !v.required || variableValues[v.name]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/deliverables">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Generate Deliverable</h1>
            <p className="text-muted-foreground">Create a new document from a prompt template</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(streamedContent || generatedContent) && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select template and provide details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt Template *</Label>
                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Engagement</Label>
                <Select value={selectedEngagementId} onValueChange={setSelectedEngagementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an engagement (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {engagements.map((engagement) => (
                      <SelectItem key={engagement.id} value={engagement.id}>
                        {engagement.name} ({engagement.client})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Deliverable Name *</Label>
                <Input
                  id="name"
                  value={deliverableName}
                  onChange={(e) => setDeliverableName(e.target.value)}
                  placeholder="e.g., Q1 Risk Assessment Report"
                />
              </div>
            </CardContent>
          </Card>

          {selectedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle>Variables</CardTitle>
                <CardDescription>Fill in the template variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPrompt.variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={variable.name}>
                      {variable.label}
                      {variable.required && <span className="text-destructive">*</span>}
                    </Label>
                    {variable.type === 'textarea' ? (
                      <Textarea
                        id={variable.name}
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.description}
                        rows={3}
                      />
                    ) : variable.type === 'select' ? (
                      <Select
                        value={variableValues[variable.name] || ''}
                        onValueChange={(value) => handleVariableChange(variable.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${variable.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={variable.name}
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={variableValues[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={variable.description}
                      />
                    )}
                  </div>
                ))}

                <Button
                  className="w-full mt-4"
                  onClick={simulateGeneration}
                  disabled={!canGenerate || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Deliverable
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} />
                    <p className="text-xs text-center text-muted-foreground">
                      {generationProgress < 30 && 'Analyzing template...'}
                      {generationProgress >= 30 && generationProgress < 60 && 'Processing variables...'}
                      {generationProgress >= 60 && generationProgress < 90 && 'Generating content...'}
                      {generationProgress >= 90 && 'Finalizing...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Preview */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Generated content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <div className="p-4">
                {streamedContent || generatedContent ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {streamedContent || generatedContent}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                    <p>Generated content will appear here</p>
                    <p className="text-sm mt-1">Select a template and fill in variables to generate</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
