"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserTransactions, submitReview } from "@/lib/api";
import { getUserId } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  transactionId: number;
  requestId: number;
  skillName: string | null;
  userName: string | null;
  completionDate: string | null;
  status: string | null;
  hasReview: boolean;
}

const reviewFormSchema = z.object({
  rating: z.string().min(1, { message: "Please select a rating" }),
  comments: z.string().min(10, { message: "Comments must be at least 10 characters" }),
});

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: "",
      comments: "",
    },
  });

  const fetchTransactions = async () => {
    const userId = getUserId();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view transactions",
      });
      return;
    }

    try {
      setLoading(true);
      const data = await getUserTransactions(userId);
      console.log("Fetched Transactions:", data); // Debug log
      setTransactions(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading transactions",
        description: error instanceof Error ? error.message : "Failed to load transactions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [toast]);

  const handleOpenReviewDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    form.reset({
      rating: "",
      comments: "",
    });
    setDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setDialogOpen(false);
    setSelectedTransaction(null);
  };

  async function onSubmitReview(values: z.infer<typeof reviewFormSchema>) {
    if (!selectedTransaction) return;

    setIsSubmitting(true);
    try {
      await submitReview({
        transactionId: selectedTransaction.transactionId,
        rating: Number.parseInt(values.rating),
        comments: values.comments,
      });

      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully",
      });

      handleCloseReviewDialog();
      await fetchTransactions(); // Refresh the data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error submitting review",
        description: error instanceof Error ? error.message : "Failed to submit review",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    try {
      const parsedDate = new Date(date);
      return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString()
        : "Invalid Date";
    } catch {
      return "Invalid Date";
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">My Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View your completed skill exchanges and leave reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.transactionId} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{transaction.skillName || "Unknown Skill"}</h3>
                      <p className="text-sm text-muted-foreground">
                        With: {transaction.userName || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completed: {formatDate(transaction.completionDate)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge>{transaction.status || "N/A"}</Badge>
                        {transaction.hasReview && <Badge variant="outline">Reviewed</Badge>}
                      </div>
                    </div>
                    {!transaction.hasReview && (
                      <Dialog
                        open={dialogOpen && selectedTransaction?.transactionId === transaction.transactionId}
                        onOpenChange={setDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={() => handleOpenReviewDialog(transaction)}>Leave Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Leave a Review</DialogTitle>
                            <DialogDescription>
                              Share your experience with {transaction.skillName || "this skill"} by{" "}
                              {transaction.userName || "this user"}
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-4 mt-4">
                              <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a rating" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="1">1 - Poor</SelectItem>
                                        <SelectItem value="2">2 - Fair</SelectItem>
                                        <SelectItem value="3">3 - Good</SelectItem>
                                        <SelectItem value="4">4 - Very Good</SelectItem>
                                        <SelectItem value="5">5 - Excellent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="comments"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Comments</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Share your experience..."
                                        className="resize-none min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={handleCloseReviewDialog}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting ? "Submitting..." : "Submit Review"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You don't have any transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}