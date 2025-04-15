"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSkill } from "@/lib/api"
import { getUserId } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  skillName: z.string().min(2, { message: "Skill name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(2, { message: "Category must be at least 2 characters" }),
})

export default function CreateSkillPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skillName: "",
      description: "",
      category: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = getUserId()
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to create a skill",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createSkill({
        ...values,
        userId,
      })

      toast({
        title: "Skill created",
        description: "Your skill has been created successfully",
      })

      form.reset()
      router.push("/dashboard")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating skill",
        description: error instanceof Error ? error.message : "Failed to create skill",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Skill</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a New Skill</CardTitle>
          <CardDescription>Share your expertise with others</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="skillName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Web Development, Guitar Lessons" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Music, Art" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your skill, experience level, and what you can offer..."
                        className="resize-none min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Skill"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
