'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

interface WorkingDay {
  day: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration: string;
}

interface SlotPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  slotsByDay: Record<string, Slot[]>;
  workingDays: WorkingDay[];
  daysOfWeek: { value: string; label: string }[];
}

export function SlotPreviewDialog({ 
  isOpen, 
  onOpenChange, 
  slotsByDay, 
  workingDays,
  daysOfWeek
}: SlotPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Preview Slots
        </Button>
      </DialogTrigger>
      <DialogContent className=" h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Available Interview Slots</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto py-4">
          <Table>
            <TableHeader>
              <TableRow>
                {daysOfWeek.map(day => (
                  <TableHead 
                    key={day.value} 
                    className={`text-center ${!workingDays.find(d => d.day === day.value)?.enabled ? 'opacity-50' : ''}`}
                  >
                    {day.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {daysOfWeek.map(day => {
                  const daySlots = slotsByDay[day.value];
                  const isEnabled = workingDays.find(d => d.day === day.value)?.enabled;
                  
                  return (
                    <TableCell 
                      key={day.value} 
                      className={`align-top ${!isEnabled ? 'opacity-50' : ''}`}
                    >
                      {daySlots.length > 0 ? (
                        <div className="space-y-2">
                          {daySlots.map((slot, index) => (
                            <div 
                              key={index} 
                              className={`p-2 rounded text-sm ${
                                slot.isBreak 
                                  ? 'bg-orange-100 border border-orange-300' 
                                  : 'bg-green-100 border border-green-300'
                              }`}
                            >
                              <div className="font-mono">
                                {slot.startTime} - {slot.endTime}
                                {slot.isBreak && <span className="ml-1 text-xs">(Break)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm p-2">
                          {isEnabled ? 'No slots' : 'Not enabled'}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
          
          {Object.values(slotsByDay).every(daySlots => daySlots.length === 0) && (
            <p className="text-muted-foreground text-center py-4">
              No slots available. Please enable at least one working day.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}