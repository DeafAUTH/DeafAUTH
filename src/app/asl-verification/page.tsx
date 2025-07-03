'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AuthFormContainer from '@/components/AuthFormContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Video, Upload, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function AslVerificationPage() {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedSignsPhrase = "HELLO WORLD"; // Inform the user about this

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
        setVideoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
        return;
      }
      setVideoFile(file);
      setFeedback(null); // Clear previous feedback
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoFile) {
      toast({
        title: 'No Video Selected',
        description: 'Please select a video file to verify.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const videoDataUri = await fileToDataUri(videoFile);
      
      const response = await fetch('/api/deafauth/verify-asl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoDataUri,
          expectedSigns: expectedSignsPhrase.split(' '),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'An API error occurred during verification.');
      }

      if (result.isAuthentic) {
        setFeedback({ type: 'success', title: 'Verification Successful!', message: result.message });
        toast({
          title: 'Verification Successful!',
          description: result.message,
          variant: 'default',
        });
      } else {
        setFeedback({ type: 'error', title: 'Verification Failed', message: result.message });
        toast({
          title: 'Verification Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('ASL Verification Submission Error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setFeedback({ type: 'error', title: 'Verification Error', message: errorMessage });
      toast({
        title: 'Verification Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="ASL Video Verification"
      description={`Please upload a video of yourself signing: "${expectedSignsPhrase}". Ensure the video is clear and well-lit.`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="asl-video-input" className="text-base">Upload ASL Video</Label>
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-muted-foreground" />
            <Input
              id="asl-video-input"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file:text-sm file:font-medium file:bg-primary/10 file:text-primary file:hover:bg-primary/20 file:border-0 file:rounded-md file:px-3 file:py-1.5"
              aria-describedby="file-upload-status"
              disabled={isLoading}
            />
          </div>
          {videoFile && <p id="file-upload-status" className="text-sm text-muted-foreground">Selected: {videoFile.name}</p>}
        </div>

        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className={feedback.type === 'success' ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200' : ''}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>{feedback.title}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !videoFile} aria-live="polite">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
          {isLoading ? 'Verifying...' : 'Verify Video'}
        </Button>
      </form>
      <div className="mt-8 text-center">
        <Link href="/" passHref>
          <Button variant="outline" className="text-sm" aria-label="Back to Home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </AuthFormContainer>
  );
}
