import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabaseServer } from "@/lib/supabase/api/server";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}

export function ForgotPasswordDialog({ open, onOpenChange, initialEmail = "" }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabaseServer.auth.resetPasswordForEmail(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent! Check your email.");
        onOpenChange(false);
      }
    } catch (err) {
      toast.error("Failed to send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your email address below and we’ll send you a link to reset your password.</p>
        </DialogHeader>
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <ToastContainer position="top-center" autoClose={3000} />
      </DialogContent>
    </Dialog>
  );
} 