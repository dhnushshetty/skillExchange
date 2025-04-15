"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile, getUserSkills, getUserRequests, getReceivedRequests } from "@/lib/api";
import { getUserId } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  dateJoining: string;
}

interface Skill {
  SkillId: number;
  SkillName: string;
  Description: string;
  Category: string;
  UserId: number;
}

interface Request {
  RequestId: number;
  UserId: number;
  userName: string;
  SkillId: number;
  SkillName: string;
  TimeStamp: string;
  Status: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const userId = getUserId();
    console.log("Logged-in User ID:", userId);

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view your dashboard",
      });
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileData, skillsData, sentRequestsData, receivedRequestsData] = await Promise.all([
          getUserProfile(userId),
          getUserSkills(userId),
          getUserRequests(userId),
          getReceivedRequests(userId),
        ]);
        console.log("Profile Data:", profileData);
        console.log("Skills Data:", skillsData);
        console.log("Sent Requests Data:", sentRequestsData);
        console.log("Received Requests Data:", receivedRequestsData);

        const validSkills = skillsData.filter(
          (skill) => skill.SkillId != null && skill.SkillName != null
        );
        const validSentRequests = sentRequestsData.filter(
          (req) => req.RequestId != null && req.SkillName && req.TimeStamp
        );
        const validReceivedRequests = receivedRequestsData.filter(
          (req) => req.RequestId != null && req.SkillName && req.TimeStamp
        );

        setProfile(profileData);
        setSkills(validSkills);
        setSentRequests(validSentRequests);
        setReceivedRequests(validReceivedRequests);
      } catch (error) {
        console.error("Fetch Error:", error);
        toast({
          variant: "destructive",
          title: "Error loading dashboard",
          description: error instanceof Error ? error.message : "Failed to load dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Joined on {profile?.dateJoining ? formatDate(profile.dateJoining) : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {profile?.name || "N/A"}
              </div>
              <div>
                <span className="font-medium">Location:</span> {profile?.location || "N/A"}
              </div>
              <div>
                <span className="font-medium">Skills:</span> {skills.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>My Skills</CardTitle>
            <CardDescription>Skills you've added to your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge key={`skill-${skill.SkillId ?? index}`} variant="secondary">
                    {skill.SkillName}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Requests</CardTitle>
            <CardDescription>Overview of your skill requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Sent:</span> {sentRequests.length}
              </div>
              <div>
                <span className="font-medium">Received:</span> {receivedRequests.length}
              </div>
              <div>
                <span className="font-medium">Pending:</span>{" "}
                {receivedRequests.filter((req) => req.Status === "Pending").length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
          <TabsTrigger value="received">Received Requests</TabsTrigger>
        </TabsList>

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
                        <Badge variant={request.Status === "Pending" ? "outline" : "default"}>
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

        <TabsContent value="received" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Requests You've Received</CardTitle>
              <CardDescription>People interested in your skills</CardDescription>
            </CardHeader>
            <CardContent>
              {receivedRequests.length > 0 ? (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={`received-${request.RequestId}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{request.SkillName || "Unknown Skill"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {request.userName || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(request.TimeStamp)}
                          </p>
                        </div>
                        <Badge variant={request.Status === "Pending" ? "outline" : "default"}>
                          {request.Status}
                        </Badge>
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
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={`skeleton-card-${i}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[120px]" />
              <Skeleton className="h-4 w-[180px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-10 w-[200px] mb-4" />
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
    </div>
  );
}