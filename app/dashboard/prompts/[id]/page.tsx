'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PromptVariable } from '@/lib/types';
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
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const variableTypes = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select' },
  { value: 'number', label: 'Number' },
];

export default function EditPromptPage() {
  const router = useRouter();
  const params = useParams();
  const { prompts, addPrompt, updatePrompt } = useAppStore();
  const isNew = params.id === 'new';
  const existingPrompt = !isNew ? prompts.find((p) => p.id === params.id) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [template, setTemplate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [variables, setVariables] = useState<PromptVariable[]>([]);

  useEffect(() => {
    if (existingPrompt) {
      setName(existingPrompt.name);
      setDescription(existingPrompt.description);
      setCategory(existingPrompt.category);
      setTemplate(existingPrompt.template);
      setTags(existingPrompt.tags);
      setVariables(existingPrompt.variables);
    }
  }, [existingPrompt]);

  const handleAddVariable = () => {
    setVariables([
      ...variables,
      {
        name: '',
        label: '',
        type: 'text',
        required: true,
      },
    ]);
  };

  const handleUpdateVariable = (index: number, field: keyof PromptVariable, value: string | boolean | string[]) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!name || !description || !category || !template) {
      toast.error('Please fill in all required fields');
      return;
    }

    const promptData = {
      name,
      description,
      category,
      template,
      tags,
      variables,
      updatedAt: new Date(),
    };

    if (isNew) {
      addPrompt({
        ...promptData,
        id: uuidv4(),
        createdAt: new Date(),
      });
      toast.success('Prompt created successfully');
    } else if (existingPrompt) {
      updatePrompt(existingPrompt.id, promptData);
      toast.success('Prompt updated successfully');
    }

    router.push('/dashboard/prompts');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/prompts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Create Prompt' : 'Edit Prompt'}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Design a new prompt template' : 'Update your prompt template'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General details about this prompt template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., ERM Risk Appetite Statement"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this prompt generates..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., ERM, Internal Audit, Governance"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
              <CardDescription>Define input fields for this template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Variable #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariable(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name (ID) *</Label>
                          <Input
                            value={variable.name}
                            onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                            placeholder="e.g., organizationName"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Label *</Label>
                          <Input
                            value={variable.label}
                            onChange={(e) => handleUpdateVariable(index, 'label', e.target.value)}
                            placeholder="e.g., Organization Name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Type *</Label>
                          <Select
                            value={variable.type}
                            onValueChange={(value) => handleUpdateVariable(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {variableTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Default Value</Label>
                          <Input
                            value={variable.defaultValue || ''}
                            onChange={(e) => handleUpdateVariable(index, 'defaultValue', e.target.value)}
                            placeholder="Optional default"
                          />
                        </div>
                      </div>
                      {variable.type === 'select' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={variable.options?.join(', ') || ''}
                            onChange={(e) => handleUpdateVariable(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={handleAddVariable} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Template */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Template *</CardTitle>
            <CardDescription>
              Use {'{{variableName}}'} syntax to insert variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="# Enter your prompt template here...&#10;&#10;Use {{variableName}} to insert variables.&#10;&#10;Example:&#10;# Risk Assessment for {{organizationName}}&#10;&#10;Industry: {{industry}}&#10;Assessment Date: {{assessmentDate}}"
              className="min-h-[600px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
