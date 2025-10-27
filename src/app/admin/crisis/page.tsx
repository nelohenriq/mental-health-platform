'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface CrisisEvent {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  source: string;
  detectedAt: string;
  flagLevel: string;
  escalationStatus: string;
  notes?: any;
}

export default function CrisisManagementPage() {
  const [crisisEvents, setCrisisEvents] = useState<CrisisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');

  useEffect(() => {
    fetchCrisisEvents();
  }, [selectedStatus]);

  const fetchCrisisEvents = async () => {
    try {
      const response = await fetch(`/api/crisis?status=${selectedStatus}`);
      if (response.ok) {
        const data = await response.json();
        setCrisisEvents(data.crisisEvents);
      }
    } catch (error) {
      console.error('Error fetching crisis events:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCrisisStatus = async (eventId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/crisis/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        fetchCrisisEvents(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating crisis event:', error);
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ESCALATED': return 'bg-red-100 text-red-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeSinceDetection = (detectedAt: string) => {
    const now = new Date();
    const detected = new Date(detectedAt);
    const diffMs = now.getTime() - detected.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading crisis management...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Shield className="h-8 w-8 mr-3 text-red-600" />
          Crisis Management
        </h1>
        <p className="text-muted-foreground">Monitor and respond to crisis situations requiring human intervention</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {crisisEvents.filter(e => e.flagLevel === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {crisisEvents.filter(e => e.escalationStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting human review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              Escalated Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {crisisEvents.filter(e => e.escalationStatus === 'ESCALATED').length}
            </div>
            <p className="text-xs text-muted-foreground">Under active intervention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {crisisEvents.filter(e =>
                e.escalationStatus === 'RESOLVED' &&
                new Date(e.detectedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Cases resolved today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-6">
        <TabsList>
          <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
          <TabsTrigger value="ESCALATED">Escalated</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {crisisEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No crisis events in this category
                </div>
              </CardContent>
            </Card>
          ) : (
            crisisEvents.map((event) => (
              <Card key={event.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{event.user.name || event.user.email}</h3>
                        <Badge className={getSeverityColor(event.flagLevel)}>
                          {event.flagLevel}
                        </Badge>
                        <Badge className={getStatusColor(event.escalationStatus)}>
                          {event.escalationStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Detected {getTimeSinceDetection(event.detectedAt)} • Source: {event.source}
                      </p>
                      {event.notes && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm">
                            <strong>Details:</strong> {typeof event.notes === 'string' ? event.notes : JSON.stringify(event.notes, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {event.escalationStatus === 'PENDING' && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateCrisisStatus(event.id, 'ESCALATED', 'Escalated for immediate intervention')}
                      >
                        Escalate Emergency
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCrisisStatus(event.id, 'ESCALATED', 'Requires therapist review')}
                      >
                        Flag for Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCrisisStatus(event.id, 'DISMISSED', 'False positive or resolved')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {event.escalationStatus === 'ESCALATED' && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateCrisisStatus(event.id, 'RESOLVED', 'Intervention completed successfully')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCrisisStatus(event.id, 'PENDING', 'Needs further review')}
                      >
                        Reassess
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Crisis Response Guidelines */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Crisis Response Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Critical (Immediate Action)</h4>
              <ul className="text-sm space-y-1">
                <li>• Contact emergency services immediately</li>
                <li>• Notify crisis intervention team</li>
                <li>• Preserve all conversation data</li>
                <li>• Block further AI responses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-600 mb-2">High Priority</h4>
              <ul className="text-sm space-y-1">
                <li>• Schedule urgent therapist consultation</li>
                <li>• Provide immediate safety resources</li>
                <li>• Monitor user status closely</li>
                <li>• Connect to crisis hotlines</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-600 mb-2">Medium Priority</h4>
              <ul className="text-sm space-y-1">
                <li>• Flag for therapist review within 24 hours</li>
                <li>• Offer additional coping strategies</li>
                <li>• Monitor for escalation</li>
                <li>• Follow up with supportive resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Low Priority</h4>
              <ul className="text-sm space-y-1">
                <li>• Monitor conversation patterns</li>
                <li>• Offer general wellness resources</li>
                <li>• Consider preventive interventions</li>
                <li>• Document for trend analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}