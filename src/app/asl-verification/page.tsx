'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthFormContainer from '@/components/AuthFormContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Camera, StopCircle, PlayCircle, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AslVerificationPage() {
  const { toast } = useToast();
  const [recordedVideoFile, setRecordedVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const expectedSignsPhrase = "HELLO WORLD"; // Inform the user about this

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(cameraStream);
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStartRecording = () => {
    if (stream) {
      handleRetake(); // Reset state before starting
      recordedChunksRef.current = [];
      
      const options = { mimeType: 'video/webm; codecs=vp9' };
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        console.error('Error creating MediaRecorder with specified mimeType, falling back.', e);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], 'asl-verification.webm', { type: 'video/webm' });
        setRecordedVideoFile(file);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            const videoUrl = URL.createObjectURL(blob);
            videoRef.current.src = videoUrl;
            videoRef.current.muted = false;
            videoRef.current.controls = true;
            videoRef.current.play();
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
    }
    setRecordedVideoFile(null);
    setFeedback(null);
    if (videoRef.current && stream) {
        videoRef.current.src = "";
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.controls = false;
        videoRef.current.play();
    }
  }

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
    if (!recordedVideoFile) {
      toast({
        title: 'No Video Recorded',
        description: 'Please record a video to verify.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const videoDataUri = await fileToDataUri(recordedVideoFile);
      
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
        const errorMessage = result.message || (result.errors ? JSON.stringify(result.errors) : 'An API error occurred during verification.');
        throw new Error(errorMessage);
      }

      // Overall success requires both authentic signs and a detected face.
      if (result.isAuthentic && result.faceDetected) {
        // If this window was opened by another, post a message and close.
        if (window.opener) {
            window.opener.postMessage({ type: 'DEAF_AUTH_SUCCESS', user: result }, '*');
            window.close();
        } else {
             setFeedback({ type: 'success', title: 'Verification Successful!', message: result.message });
        }
      } else {
        setFeedback({ type: 'error', title: 'Verification Failed', message: result.message });
      }
    } catch (error) {
      console.error('ASL Verification Submission Error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setFeedback({ type: 'error', title: 'Verification Error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="ASL Video Verification"
      description={`Record a video of yourself signing: "${expectedSignsPhrase}". Ensure your face is clear and you are in a well-lit environment.`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col items-center justify-center min-h-[300px] space-y-4">
          {hasCameraPermission === null && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Requesting camera access...</p>
            </div>
          )}
          {hasCameraPermission === false && (
            <Alert variant="destructive">
                <Camera className="h-5 w-5" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access in your browser to use this feature.
                </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission && (
            <div className="w-full">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isRecording && !recordedVideoFile && (
                <Button type="button" onClick={handleStartRecording} disabled={!hasCameraPermission || isLoading} size="lg">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Recording
                </Button>
            )}

            {isRecording && (
                 <Button type="button" onClick={handleStopRecording} variant="destructive" size="lg">
                    <StopCircle className="mr-2 h-5 w-5" />
                    Stop Recording
                </Button>
            )}

            {recordedVideoFile && !isLoading && (
                 <>
                    <Button type="button" onClick={handleRetake} variant="outline">
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Retake Video
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !recordedVideoFile} aria-live="polite">
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      {isLoading ? 'Verifying...' : 'Verify Video'}
                    </Button>
                 </>
            )}
        </div>

        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <AlertTitle>{feedback.title}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

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
