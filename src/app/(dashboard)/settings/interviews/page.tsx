'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Plus, X } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';
import { toast } from "sonner";
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

interface Panelist {
  id: string;
  name: string;
  email: string;
}

export default function InterviewSettingsPage() {
  const { user } = useAuth();
  const { schoolId, setSchoolId } = useAuthStore();
  const [defaultPanelists, setDefaultPanelists] = useState<Panelist[]>([]);
  const [newPanelist, setNewPanelist] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch school_id if it's null
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.school_id) {
          setSchoolId(data.school_id);
        } else {
          // Redirect to select organization if school_id is missing
          router.push('/select-organization');
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
        toast.error('Failed to load organization information');
        router.push('/select-organization');
      }
    };
    
    if (!schoolId && user?.id) {
      fetchSchoolId();
    }
  }, [schoolId, user?.id, setSchoolId, router]);

  // Fetch default panelists from Supabase
  useEffect(() => {
    const fetchPanelists = async () => {
      if (!schoolId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('interview_panelists')
          .select('*')
          .eq('school_id', schoolId);
        
        if (error) throw error;
        
        setDefaultPanelists(data || []);
      } catch (error) {
        console.error('Error fetching panelists:', error);
        toast.error('Failed to load panelists');
      } finally {
        setLoading(false);
      }
    };
    
    if (schoolId) {
      fetchPanelists();
    }
  }, [schoolId]);

  // Add a new default panelist
  const handleAddPanelist = async () => {
    if (!schoolId) {
      toast.error('Organization information not available. Please try again.');
      return;
    }
    
    if (!newPanelist.name.trim() || !newPanelist.email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPanelist.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('interview_panelists')
        .insert({
          school_id: schoolId,
          name: newPanelist.name,
          email: newPanelist.email
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setDefaultPanelists(prev => [...prev, data]);
      setNewPanelist({ name: '', email: '' });
      toast.success('Panelist added successfully');
    } catch (error) {
      console.error('Error adding panelist:', error);
      toast.error('Failed to add panelist');
    }
  };

  // Remove a default panelist
  const handleRemovePanelist = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('interview_panelists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDefaultPanelists(prev => prev.filter(panelist => panelist.id !== id));
      toast.success('Panelist removed successfully');
    } catch (error) {
      console.error('Error removing panelist:', error);
      toast.error('Failed to remove panelist');
    }
  };

  // Show loading state if schoolId is not available yet
  if (!schoolId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Interview Settings</h3>
          <p className="text-sm text-muted-foreground">
            Loading organization information...
          </p>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Interview Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your default interview panelists
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Default Panelists</CardTitle>
          <CardDescription>
            Add panelists who are frequently involved in interviews. They will be available for quick selection when scheduling interviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new panelist form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPanelist.name}
                onChange={(e) => setNewPanelist(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Panelist name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newPanelist.email}
                onChange={(e) => setNewPanelist(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Panelist email"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPanelist} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Panelist
              </Button>
            </div>
          </div>
          
          {/* Panelists list */}
          <div className="space-y-2">
            <h4 className="font-medium">Saved Panelists</h4>
            {loading ? (
              <p>Loading panelists...</p>
            ) : defaultPanelists.length === 0 ? (
              <p className="text-muted-foreground">No panelists added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {defaultPanelists.map((panelist) => (
                  <div 
                    key={panelist.id} 
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{panelist.name} ({panelist.email})</span>
                    <button 
                      type="button"
                      onClick={() => handleRemovePanelist(panelist.id)}
                      className="text-blue-800 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}