
'use client';

import { useEffect, useState, useMemo, use } from 'react';
import {
  summarizePatientFiles,
  type SummarizePatientFilesOutput,
} from '@/ai/flows/summarize-patient-files';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, User, Calendar, FileWarning, History, AlertCircle, PlusCircle, LineChart, Pill, FlaskConical, ImageIcon, Mic, MicOff } from 'lucide-react';
import { type HealthRecord, doctors, type Consultation, vitalHistory as mockVitalHistory } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Line, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import {  deleteDoc } from 'firebase/firestore';

const recordIcons: Record<HealthRecord['type'], React.ReactNode> = {
  PDF: <FileText className="size-5 text-blue-500" />,
  Imaging: <ImageIcon className="size-5 text-purple-500" />,
  'Lab Report': <FlaskConical className="size-5 text-green-500" />,
  Prescription: <Pill className="size-5 text-orange-500" />,
};

const timelineIcons: Record<string, React.ReactNode> = {
    ...recordIcons,
    Consultation: <History className="size-5 text-indigo-500" />
};

let recognition: SpeechRecognition | null = null;


export default function DoctorViewPatientPage({ params }: { params: { patientId: string } }) {
  const sessionId = params.patientId; // This is now the session ID
  const [session, loadingSession] = useDocument(doc(db, 'sharedSessions', sessionId));
  // Expiry check
const isExpired = (() => {
  const expires = session?.data()?.expiresAt?.toDate?.();
  return expires ? expires < new Date() : false;
})();

  const patientId = session?.data()?.patientId;

  const [patientData, loadingPatient] = useDocument(patientId ? doc(db, 'users', patientId) : null);
  const [healthRecordsCol, loadingRecords] = useCollection(patientId ? query(collection(db, 'users', patientId, 'healthRecords'), orderBy('createdAt', 'desc')) : null);
  const [consultationsCol, loadingConsultations, errorConsultations] = useCollection(patientId ? query(collection(db, 'users', patientId, 'consultations'), orderBy('date', 'desc')) : null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummarizePatientFilesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [newConsultation, setNewConsultation] = useState({ notes: '', prescription: '' });

  const [isListening, setIsListening] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  
  const doctor = doctors[0];
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
             setNewConsultation(prev => ({
                ...prev,
                notes: prev.notes + finalTranscript
            }));
        }
      };
    
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
              return; 
          }
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}. Please ensure microphone access is allowed.`);
          setIsListening(false);
      };

      recognition.onend = () => {
          if (isListening) {
              recognition?.start();
          }
      }
    }
    
    return () => {
        if (recognition) {
            recognition.stop();
        }
    };
  }, [isListening]);
  
    const healthRecords = useMemo(() => healthRecordsCol?.docs.map(d => ({id: d.id, ...d.data()})) as HealthRecord[] || [], [healthRecordsCol]);
    const consultations = useMemo(() => consultationsCol?.docs.map(d => ({id: d.id, ...d.data()})) as Consultation[] || [], [consultationsCol]);


  const timeline = useMemo(() => {
    const combined = [
        ...healthRecords.map(r => ({ ...r, timelineType: r.type as string, sortDate: new Date(r.date) })),
        ...consultations.map(c => ({ ...c, timelineType: 'Consultation' as const, name: `Consultation with ${c.doctor}`, sortDate: new Date(c.date) }))
    ];
    return combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  }, [healthRecords, consultations]);


  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);
    setError(null);
    
    try {
      const result = await summarizePatientFiles({
        patientFiles: healthRecords.map(r => ({
            fileName: r.name,
            fileDataUri: `data:text/plain;base64,${btoa(`Mock content for file: ${r.name} of type ${r.type}`)}`
        })),
        consultationNotes: consultations.map(c => ({
            doctor: c.doctor,
            date: c.date,
            notes: c.notes,
        }))
      });
      setSummary(result);
    } catch (e) {
      console.error(e);
      setError('Failed to generate summary. The AI model might be unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddConsultation = async () => {
      if (!newConsultation.notes || !patientId) return;

      const consultationRef = collection(db, 'users', patientId, 'consultations');
      try {
        await addDoc(consultationRef, {
            doctor: doctor.name,
            date: new Date().toISOString().split('T')[0],
            notes: newConsultation.notes,
            prescription: newConsultation.prescription || null
        });
        setNewConsultation({ notes: '', prescription: '' });
      } catch (e) {
          console.error("Error adding consultation", e);
          setError("Failed to save consultation.");
      }
  };
  
   const handleListen = () => {
        if (isListening) {
            recognition?.stop();
            setIsListening(false);
        } else {
            setNewConsultation(prev => ({ ...prev, notes: prev.notes ? prev.notes + ' ' : '' }));
            recognition?.start();
            setIsListening(true);
        }
    };


  const chartConfig = {
    systolic: {
      label: 'Systolic',
      color: 'hsl(var(--chart-1))',
    },
    diastolic: {
      label: 'Diastolic',
      color: 'hsl(var(--chart-2))',
    },
  }

  if (!session?.exists() || isExpired) {
  return <div className="text-center py-10">Invalid or expired session link.</div>
}

  
  if (!session?.exists() || isExpired) {
  return (
    <div className="text-center py-10 space-y-3">
      <p className="text-base font-medium">This link is no longer valid.</p>
      <p className="text-sm text-muted-foreground">Ask the patient to generate a new one.</p>
    </div>
  );
}


  return (
    <div className="max-w-7xl mx-auto space-y-4">
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Doctor's Portal</CardTitle>
                    <CardDescription>
                        You have temporary secure access to the complete medical history for <span className="font-bold">{patientData?.data()?.name}</span>.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-4 text-right">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={doctor.avatar} alt={doctor.name} />
                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Viewing as: {doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <User /> Patient Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={patientData?.data()?.photoURL || ''} alt={patientData?.data()?.name} />
                            <AvatarFallback>{patientData?.data()?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-xl">{patientData?.data()?.name}</p>
                            <p className="text-muted-foreground">Patient ID: {patientId}</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><LineChart/> Health Trends</CardTitle>
                        <CardDescription>Blood pressure readings over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <RechartsLineChart data={mockVitalHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Line dataKey="systolic" type="monotone" strokeWidth={2} stroke="var(--color-systolic)" dot={true} />
                                <Line dataKey="diastolic" type="monotone" strokeWidth={2} stroke="var(--color-diastolic)" dot={true} />
                            </RechartsLineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Center Column */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><History /> Patient Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                        {timeline.map((item: any) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="bg-muted p-2.5 rounded-full mt-1">
                                    {timelineIcons[item.timelineType]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.timelineType === 'Consultation' ? 'Consultation' : item.type} &middot; {item.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="sticky top-4">
                    <CardHeader>
                        <CardTitle className="text-lg">AI Summary & Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>Analyzing full patient history...</p>
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {summary && (
                            <div className="space-y-4">
                                {summary.criticalDocuments && summary.criticalDocuments.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-md mb-2 flex items-center gap-2">
                                            <AlertCircle className="text-destructive"/>
                                            Priority Review
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {summary.criticalDocuments.map((doc, index) => (
                                                <Badge key={index} variant="destructive">{doc}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-md mb-2">Holistic Summary</h3>
                                    <div className="prose prose-sm max-w-none text-foreground/90">
                                        <p>{summary.holisticSummary}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!isLoading && !summary && (
                            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground h-full p-8">
                                <p>Click to generate an AI-powered summary of all records and consultations to quickly identify key health points.</p>
                                <Button onClick={handleGenerateSummary} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Full Summary
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><PlusCircle /> Add New Consultation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                           <div className="flex justify-between items-center">
                                <Label htmlFor="consultation-notes">Consultation Notes</Label>
                                <Button variant={isListening ? "destructive" : "outline"} size="sm" onClick={handleListen} disabled={!isSpeechRecognitionSupported}>
                                    {isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                                    {isListening ? 'Stop' : 'Record'}
                                </Button>
                           </div>
                           <Textarea 
                                id="consultation-notes" 
                                placeholder={isListening ? "Listening..." : "Enter notes from the visit, or click Record to use your voice."}
                                value={newConsultation.notes}
                                onChange={(e) => setNewConsultation({...newConsultation, notes: e.target.value})}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                           <Label htmlFor="consultation-prescription">Prescription (Optional)</Label>
                           <Input 
                                id="consultation-prescription" 
                                placeholder="e.g., Amoxicillin 500mg" 
                                value={newConsultation.prescription}
                                onChange={(e) => setNewConsultation({...newConsultation, prescription: e.target.value})}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddConsultation} disabled={!newConsultation.notes}>Save Consultation</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
