import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/api/client";
import { Mail, Loader2 } from "lucide-react";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}

export function ForgotPasswordDialog({ open, onOpenChange, initialEmail = "" }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Create the supabase client instance
  const supabase = createClient();

  // Update email when initialEmail changes or dialog opens
  useEffect(() => {
    if (open) {
      setEmail(initialEmail || "");
      setEmailSent(false);
    }
  }, [open, initialEmail]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        }
      );
      
      // Security: Always show success message to prevent user enumeration
      // Don't reveal whether the email exists in the system
      toast.success("If an account with this email exists, you will receive a password reset link.");
      setEmailSent(true);
      
      // Log errors for debugging but don't show to user
      if (error) {
        console.error("Password reset error:", error);
      }
      
      // Auto-close dialog after 2 seconds
      setTimeout(() => {
        setEmail("");
        setEmailSent(false);
        onOpenChange(false);
      }, 2000);
      
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      // Even for unexpected errors, show generic message
      toast.success("If an account with this email exists, you will receive a password reset link.");
      setEmailSent(true);
      
      setTimeout(() => {
        setEmail("");
        setEmailSent(false);
        onOpenChange(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Forgot Password
          </DialogTitle>
          <DialogDescription>
            {emailSent ? (
              "If an account with this email exists, we've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password."
            ) : (
              "Enter your email address below and we'll send you a link to reset your password if an account exists."
            )}
          </DialogDescription>
        </DialogHeader>
        
        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-green-900">Request Sent!</h3>
              <p className="text-sm text-green-700 mt-1">
                If an account exists, check your email for the reset link.
              </p>
            </div>
            <Button 
              onClick={() => {
                setEmail("");
                setEmailSent(false);
                onOpenChange(false);
              }} 
              variant="outline" 
              className="w-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading || !email.trim()} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        )}
        <ToastContainer position="top-center" autoClose={3000} />
      </DialogContent>
    </Dialog>
  );
}
