"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserRequests, getReceivedRequests, completeRequest, updateRequest } from "@/lib/api";
import { getUserId } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Request {
  RequestId: number;
  UserId: number;
  userName: string;
  SkillId: number;
  SkillName: string;
  TimeStamp: string;
  Status: string;
}

export default function SkillRequestsPage() {
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const userId = getUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view requests",
      });
      return;
    }

    try {
      setLoading(true);
      const [sentData, receivedData] = await Promise.all([
        getUserRequests(userId),
        getReceivedRequests(userId),
      ]);
      console.log("Sent Requests:", sentData);
      console.log("Received Requests:", receivedData);

      // Filter invalid requests
      const validSent = sentData.filter(
        (req) => req.RequestId != null && req.SkillName && req.TimeStamp
      );
      const validReceived = receivedData.filter(
        (req) => req.RequestId != null && req.SkillName && req.TimeStamp
      );

      setSentRequests(validSent);
      setReceivedRequests(validReceived);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading requests",
        description: error instanceof Error ? error.message : "Failed to load requests",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [toast]);

  const handleUpdateStatus = async (requestId: number, status: string) => {
    setProcessingId(requestId);
    try {
      await updateRequest(requestId, status);
      toast({
        title: "Status updated",
        description: `Request marked as ${status}`,
      });
      await fetchRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating request",
        description: error instanceof Error ? error.message : "Failed to update request",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await completeRequest(requestId);
      toast({
        title: "Request completed",
        description: "The request has been completed and added to transactions",
      });
      await fetchRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error completing request",
        description: error instanceof Error ? error.message : "Failed to complete request",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (timeStamp: string) => {
    try {
      const date = new Date(timeStamp);
      return date instanceof Date && !isNaN(date.getTime())
        ? date.toLocaleDateString()
        : "Invalid Date";
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Skill Requests</h1>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received">Received Requests</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Requests You've Received</CardTitle>
              <CardDescription>Manage requests for your skills</CardDescription>
            </CardHeader>
            <CardContent>
              {receivedRequests.length > 0 ? (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={`received-${request.RequestId}`} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{request.SkillName || "Unknown Skill"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {request.userName || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(request.TimeStamp)}
                          </p>
                          <Badge
                            className="mt-2"
                            variant={request.Status === "Pending" ? "outline" : "default"}
                          >
                            {request.Status}
                          </Badge>
                        </div>
                        {request.Status === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateStatus(request.RequestId, "Accepted")}
                              disabled={processingId === request.RequestId}
                              variant="outline"
                            >
                              {processingId === request.RequestId ? "Processing..." : "Accept"}
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(request.RequestId, "Rejected")}
                              disabled={processingId === request.RequestId}
                              variant="destructive"
                            >
                              {processingId === request.RequestId ? "Processing..." : "Reject"}
                            </Button>
                          </div>
                        )}
                        {request.Status === "Accepted" && (
                          <Button
                            onClick={() => handleCompleteRequest(request.RequestId)}
                            disabled={processingId === request.RequestId}
                          >
                            {processingId === request.RequestId ? "Processing..." : "Mark as Completed"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You haven't received any requests yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Requests You've Sent</CardTitle>
              <CardDescription>Track the status of your skill requests</CardDescription>
            </CardHeader>
            <CardContent>
              {sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={`sent-${request.RequestId}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{request.SkillName || "Unknown Skill"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested from: {request.userName || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(request.TimeStamp)}
                          </p>
                        </div>
                        <Badge
                          variant={request.Status === "Pending" ? "outline" : "default"}
                        >
                          {request.Status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You haven't sent any requests yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}