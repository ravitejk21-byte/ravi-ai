'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Briefcase,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { prompts, engagements, deliverables, documents } = useAppStore();

  const activeEngagements = engagements.filter((e) => e.status === 'active');
  const completedDeliverables = deliverables.filter((d) => d.status === 'delivered');
  const inProgressDeliverables = deliverables.filter((d) => d.status === 'draft' || d.status === 'in-review');

  const stats = [
    {
      title: 'Prompt Templates',
      value: prompts.length,
      description: 'Available templates',
      icon: Sparkles,
      href: '/dashboard/prompts',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Active Engagements',
      value: activeEngagements.length,
      description: 'Ongoing projects',
      icon: Briefcase,
      href: '/dashboard/engagements',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Deliverables',
      value: deliverables.length,
      description: `${inProgressDeliverables.length} in progress`,
      icon: FileText,
      href: '/dashboard/deliverables',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Documents',
      value: documents.length,
      description: 'In knowledge base',
      icon: BookOpen,
      href: '/dashboard/knowledge',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const quickActions = [
    {
      title: 'Generate Deliverable',
      description: 'Create a new document from template',
      href: '/dashboard/deliverables/new',
      icon: FileText,
    },
    {
      title: 'New Engagement',
      description: 'Start a new client engagement',
      href: '/dashboard/engagements/new',
      icon: Briefcase,
    },
    {
      title: 'Upload Document',
      description: 'Add to knowledge base',
      href: '/dashboard/knowledge/upload',
      icon: BookOpen,
    },
    {
      title: 'Create Prompt',
      description: 'Design a new template',
      href: '/dashboard/prompts/new',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your consulting workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your engagements</CardDescription>
          </CardHeader>
          <CardContent>
            {engagements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/engagements/new">Create Engagement</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {engagements.slice(0, 5).map((engagement) => (
                  <div key={engagement.id} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{engagement.name}</p>
                      <p className="text-xs text-muted-foreground">{engagement.client}</p>
                    </div>
                    <Badge variant={engagement.status === 'active' ? 'default' : 'secondary'}>
                      {engagement.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Templates</CardTitle>
          <CardDescription>Popular prompt templates to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.slice(0, 3).map((prompt) => (
              <Link key={prompt.id} href={`/dashboard/deliverables/new?prompt=${prompt.id}`}>
                <div className="group rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="outline">{prompt.category}</Badge>
                  </div>
                  <h3 className="mt-3 font-medium group-hover:text-primary transition-colors">
                    {prompt.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {prompt.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {prompt.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
