"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteConfirmationModal from "../store/components/DeleteConfirmationModal";

interface Exception {
  id: string;
  word: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export default function ExceptionsPage() {
  const { data: session } = useSession();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddException, setShowAddException] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch exceptions
  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exceptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setExceptions(data || []);
    } catch (error) {
      console.error('Error fetching exceptions:', error);
      setError('Failed to fetch exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  // Delete exception handler
  const handleDeleteException = async (id: string) => {
    if (!id || !session) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const { error } = await supabase
        .from('exceptions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setExceptions(exceptions.filter(exception => exception.id !== id));
      
    } catch (error) {
      console.error('Error deleting exception:', error);
      setError('Failed to delete exception. Please make sure you have admin privileges.');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  // Add exception handler
  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setError("You must be logged in as an admin to add exceptions");
      return;
    }
    
    if (!newWord.trim()) {
      setError("Word is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { data, error } = await supabase
        .from('exceptions')
        .insert({
          word: newWord.trim().toUpperCase(),
          reason: newReason.trim() || null
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('This word is already in the exceptions list');
        } else {
          throw error;
        }
        return;
      }

      setExceptions([data, ...exceptions]);
      setNewWord("");
      setNewReason("");
      setShowAddException(false);
    } catch (error) {
      console.error('Error adding exception:', error);
      setError('Failed to add exception. Please make sure you have admin privileges.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-2 text-white/60">Loading exceptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 
          className="text-white text-2xl md:text-3xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Manage Exceptions
        </h1>

        <button
          className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 text-sm font-semibold transition-colors"
          onClick={() => setShowAddException(true)}
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Add Exception
        </button>
      </div>

      {/* Add Exception Form */}
      {showAddException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black rounded-lg border border-white/20 shadow-lg p-6 w-full max-w-md">
            <h3 
              className="text-lg font-semibold mb-4 text-white"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Add New Exception
            </h3>
            
            <form onSubmit={handleAddException} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Word *</label>
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value.toUpperCase())}
                  className="w-full bg-white/10 border-white/20 rounded-md text-white placeholder:text-white/40"
                  placeholder="Enter forbidden word"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Reason</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full bg-white/10 border-white/20 rounded-md text-white placeholder:text-white/40"
                  placeholder="Why is this word forbidden?"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddException(false);
                    setNewWord("");
                    setNewReason("");
                    setError(null);
                  }}
                  className="px-4 py-2 border border-white/20 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-white/90 transition-colors relative"
                  style={{ fontFamily: 'Chalkduster, fantasy' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">Add Exception</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    'Add Exception'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exceptions List */}
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        {exceptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-white/80">No exceptions added yet.</p>
            <p className="mt-2 text-white/60">Add words that should not be allowed as Famous moments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-white/60">Word</TableHead>
                  <TableHead className="text-white/60">Reason</TableHead>
                  <TableHead className="text-white/60">Added</TableHead>
                  <TableHead className="text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((exception) => (
                  <TableRow key={exception.id} className="border-white/20">
                    <TableCell className="font-medium text-white">
                      {exception.word}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {exception.reason || '-'}
                    </TableCell>
                    <TableCell className="text-white/60">
                      {new Date(exception.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(exception.id)}
                        className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirm(null);
          }
        }}
        onConfirm={async () => {
          if (deleteConfirm) {
            await handleDeleteException(deleteConfirm);
          }
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
} 