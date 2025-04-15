"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllSkills, createRequest } from "@/lib/api"
import { getUserId } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Skill {
  skillId: number
  skillName: string
  description: string
  category: string
  userId: number
  userName: string
}

const formSchema = z.object({
  skillId: z.string().min(1, { message: "Please select a skill" }),
})

export default function CreateRequestPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skillId: "",
    },
  })

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true)
        const userId = getUserId()
        if (!userId) return

        const allSkills = await getAllSkills()
        // Filter out the user's own skills
        const otherUserSkills = allSkills.filter((skill) => skill.userId.toString() !== userId)
        setSkills(otherUserSkills)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading skills",
          description: error instanceof Error ? error.message : "Failed to load skills",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
  }, [toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = getUserId()
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to create a request",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createRequest({
        userId,
        skillId: Number.parseInt(values.skillId),
      })

      toast({
        title: "Request created",
        description: "Your request has been sent successfully",
      })

      form.reset()
      router.push("/dashboard")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating request",
        description: error instanceof Error ? error.message : "Failed to create request",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Request</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request a Skill</CardTitle>
          <CardDescription>Send a request to learn from someone else's skill</CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="skillId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select a Skill</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill to request" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skills.map((skill) => (
                            <SelectItem key={skill.skillId} value={skill.skillId.toString()}>
                              {skill.skillName} by {skill.userName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending Request..." : "Send Request"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No skills available to request at the moment.</p>
              <p className="text-sm mt-2">Check back later or encourage others to add their skills.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
