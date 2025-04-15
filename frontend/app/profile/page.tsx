"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile, updateUserProfile } from "@/lib/api";
import { getUserId } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).transform((val) => val.trim()),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9\s-]{10,15}$/.test(val),
      { message: "Phone number must be 10–15 digits, spaces, or dashes" }
    ),
  location: z.string().optional().transform((val) => val?.trim() || ""),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters" }).transform((val) => val.trim()),
});

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view your profile",
      });
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile(userId);
        if (!profile) {
          throw new Error("Profile not found");
        }
        form.reset({
          name: profile.name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          location: profile.location ?? "",
          bio: profile.bio ?? "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile data";
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: message,
        });
        if (message.includes("not found")) {
          router.push("/login"); // Redirect if user not found
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, toast, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = getUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "Please log in to update your profile",
      });
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      // Exclude email from update since backend doesn't support it
      const { email, ...updateData } = values;
      await updateUserProfile(userId, updateData);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[150px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information. Email cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={loading || saving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={true} />
                    </FormControl>
                    <CardDescription className="text-xs">
                      Contact support to change your email.
                    </CardDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-7890" {...field} disabled={loading || saving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="New York, NY" {...field} disabled={loading || saving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none min-h-[100px]"
                        {...field}
                        disabled={loading || saving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading || saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}