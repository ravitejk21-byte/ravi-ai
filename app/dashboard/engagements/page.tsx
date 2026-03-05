'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Briefcase,
  FileText,
  BookOpen,
  Clock,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';

export default function EngagementsPage() {
  const { engagements, prompts, documents, deliverables } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engagements</h1>
          <p className="text-muted-foreground mt-2">
            Manage your client engagements and projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/engagements/new">
            <Plus className="mr-2 h-4 w-4" />
            New Engagement
          </Link>
        </Button>
      </div>

      {engagements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-xl font-medium">No engagements yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center">
              Create your first engagement to start organizing prompts, documents, and deliverables by client project.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/engagements/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Engagement
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {engagements.map((engagement) => {
            const engagementPrompts = prompts.filter(p => p.engagementId === engagement.id);
            const engagementDocs = documents.filter(d => d.engagementId === engagement.id);
            const engagementDeliverables = deliverables.filter(d => d.engagementId === engagement.id);

            return (
              <Card key={engagement.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle>{engagement.name}</CardTitle>
                        <Badge variant={engagement.status === 'active' ? 'default' : 'secondary'}>
                          {engagement.status}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {engagement.client} • {engagement.sector}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {engagement.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <FileText className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{engagementPrompts.length}</p>
                        <p className="text-xs text-muted-foreground">Prompts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <BookOpen className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{engagementDocs.length}</p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Briefcase className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{engagementDeliverables.length}</p>
                        <p className="text-xs text-muted-foreground">Deliverables</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Created {formatDistanceToNow(engagement.createdAt)}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/engagements/${engagement.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
