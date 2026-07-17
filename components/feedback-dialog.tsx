"use client";

import { useState } from "react";
import { MessageSquare, Send, X, Star } from "lucide-react";
import { toast } from "sonner";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() && rating === 0) {
      toast.error("Please provide a rating or feedback");
      return;
    }

    try {
      // Store feedback locally (in production, send to API)
      const entry = {
        rating,
        feedback: feedback.trim(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      const existing = JSON.parse(localStorage.getItem("veil-feedback") || "[]");
      existing.push(entry);
      localStorage.setItem("veil-feedback", JSON.stringify(existing));

      setSubmitted(true);
      toast.success("Thank you for your feedback!");

      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setRating(0);
        setFeedback("");
      }, 2000);
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        title="Give Feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve Veil.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Feedback</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      How would you rate your experience?
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Tell us more (optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="What did you like? What could be better?"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Submit Feedback
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
