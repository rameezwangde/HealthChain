
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  FileText,
  Users,
  BookText,
  Activity,
  Share2,
  LinkIcon,
  Copy,
  PlusCircle,
  FlaskConical,
  ImageIcon,
  Pill,
  UploadCloud,
  Loader2,
  Sparkles,
  History,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  categorizeDocument,
  type CategorizeDocumentOutput,
} from '@/ai/flows/categorize-document';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { doc, collection, addDoc,setDoc,Timestamp, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

type HealthRecord = {
  id: string;
  name: string;
  type: 'PDF' | 'Imaging' | 'Lab Report' | 'Prescription';
  date: string;
  size: string;
  url: string;
};

type Consultation = {
  id: string;
  doctor: string;
  date: string;
  notes: string;
  prescription?: string;
};

const roleColors: Record<string, string> = {
  Doctor: 'bg-blue-500',
  Pharmacist: 'bg-purple-500',
  Diagnostics: 'bg-orange-500',
  Patient: 'bg-green-500',
};

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

function ShareHistoryDialog() {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = async () => {
  if (!user) return;
  setIsGenerating(true);
  try {
    const sessionId = uuidv4();

    const sessionRef = doc(collection(db, 'sharedSessions'), sessionId);

    await setDoc(sessionRef, {
      patientId: user.uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)), // ✅ 15 minutes
    });

    const link = `${window.location.origin}/doctor/view/patient/${sessionId}`;
    setGeneratedLink(link);
  } catch (e) {
    console.error('Error creating share link', e);
    // show toast if needed
  } finally {
    setIsGenerating(false);
  }
};

  const handleLinkCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: 'Link Copied!',
      description: 'The secure link has been copied to your clipboard.',
    });
  };

  return (
     <Dialog onOpenChange={() => setGeneratedLink('')}>
      <DialogTrigger asChild>
        <Button size="lg">
            <Share2 />
            Share Medical History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Full Medical History</DialogTitle>
          <DialogDescription>
            Generate a secure, temporary link for your doctor to view your complete health profile.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
             <div className="flex flex-col items-center justify-center gap-4 py-4">
                <p className="text-center text-sm">Click the button below to generate a unique and secure link for your doctor.</p>
                <Button onClick={handleGenerateLink} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <LinkIcon className="mr-2" />}
                    Generate Secure Link
                </Button>
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className="p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={generatedLink} size={160} />
                </div>
                <p className="text-sm text-muted-foreground">Doctor can scan this to get access.</p>
                <div className="w-full flex items-center space-x-2">
                    <p className="text-sm font-mono p-2 bg-muted rounded-md flex-grow overflow-x-auto text-green-700">
                        {generatedLink}
                    </p>
                    <Button variant="outline" size="icon" onClick={handleLinkCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <Button asChild className="w-full">
                    <Link href={generatedLink} target="_blank">
                        <LinkIcon />
                        Open Doctor's View
                    </Link>
                </Button>
            </div>
        )}

        <DialogFooter className="sm:justify-center">
            <p className="text-xs text-muted-foreground">For security, access links should be handled with care.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UploadDialog({ onRecordAdd }: { onRecordAdd: () => void }) {
    const [user] = useAuthState(auth);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestion, setSuggestion] = useState<CategorizeDocumentOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recordName, setRecordName] = useState('');
    const [recordType, setRecordType] = useState<HealthRecord['type']>('PDF');

    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            handleCategorize(selectedFile);
        }
    };

    const handleCategorize = async (fileToCategorize: File) => {
        setIsProcessing(true);
        setSuggestion(null);
        setError(null);
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(fileToCategorize);
            reader.onload = async (e) => {
                const dataUri = e.target?.result as string;
                if (dataUri) {
                    const result = await categorizeDocument({
                        fileName: fileToCategorize.name,
                        fileDataUri: dataUri,
                    });
                    setSuggestion(result);
                    setRecordName(result.recordName);
                    setRecordType(result.recordType);
                }
            }
        } catch (e) {
            console.error(e);
            setError('Could not categorize document. Please enter details manually.');
            setRecordName(fileToCategorize.name);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSave = async () => {
        if (!recordName || !recordType || !file || !user) return;
        
        setIsProcessing(true);
        setError(null);

        try {
            // 1. Upload file to Cloud Storage
            const storageRef = ref(storage, `records/${user.uid}/${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // 2. Add record to Firestore
            const recordsRef = collection(db, 'users', user.uid, 'healthRecords');
            await addDoc(recordsRef, {
                name: recordName,
                type: recordType,
                date: new Date().toLocaleDateString('en-CA'),
                size: `${(file.size / 1024).toFixed(2)} KB`,
                url: downloadURL,
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Record Added',
                description: `${recordName} has been successfully added to your records.`,
            });
            onRecordAdd(); // This will trigger a re-fetch in the parent
            
            // Reset state
            setFile(null);
            setSuggestion(null);
            setRecordName('');
            setRecordType('PDF');
            setError(null);

        } catch (e) {
            console.error('Error saving record:', e);
            setError('Failed to save the record. Please check your connection and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog onOpenChange={(open) => !open && setFile(null)}>
            <DialogTrigger asChild>
                <Button>
                    <UploadCloud />
                    Upload Record
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload New Health Record</DialogTitle>
                    <DialogDescription>
                        Select a file and our AI will help categorize it for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input id="picture" type="file" onChange={handleFileChange} disabled={isProcessing} />
                    
                    {isProcessing && (
                         <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>{suggestion ? 'Saving record...' : 'AI is analyzing your document...'}</p>
                        </div>
                    )}
                    
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                    {suggestion && !isProcessing && (
                        <Alert className="border-primary/30 bg-primary/10">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <AlertTitle className="text-primary">AI Suggestion</AlertTitle>
                            <AlertDescription>We've pre-filled the details based on the document. Please review and adjust if needed.</AlertDescription>
                        </Alert>
                    )}

                    {(file && !isProcessing) && (
                        <div className="space-y-4 border-t pt-4">
                             <div className="grid gap-2">
                                <Label htmlFor="record-name">Record Name</Label>
                                <Input id="record-name" value={recordName} onChange={(e) => setRecordName(e.target.value)} />
                             </div>
                             <div className="grid gap-2">
                                <Label htmlFor="record-type">Record Type</Label>
                                <Select value={recordType} onValueChange={(value: HealthRecord['type']) => setRecordType(value)}>
                                    <SelectTrigger id="record-type">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PDF">General Document (PDF)</SelectItem>
                                        <SelectItem value="Lab Report">Lab Report</SelectItem>
                                        <SelectItem value="Imaging">Imaging (X-Ray, MRI)</SelectItem>
                                        <SelectItem value="Prescription">Prescription</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>
                    )}

                </div>
                <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isProcessing}>Cancel</Button>
                     </DialogClose>
                     <DialogClose asChild>
                        <Button onClick={handleSave} disabled={!file || isProcessing || !recordName}>
                            Save Record
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardPage() {
    const [user, loadingAuth] = useAuthState(auth);

    const [patientDoc, loadingPatient] = useDocumentData(user ? doc(db, 'users', user.uid) : null);

    const [healthRecordsCol, loadingRecords] = useCollection(user ? query(collection(db, 'users', user.uid, 'healthRecords'), orderBy('createdAt', 'desc')) : null);
    const [consultationsCol, loadingConsultations] = useCollection(user ? query(collection(db, 'users', user.uid, 'consultations'), orderBy('date', 'desc')) : null);

    const healthRecords = useMemo(() => healthRecordsCol?.docs.map(d => ({id: d.id, ...d.data()} as HealthRecord)) || [], [healthRecordsCol]);
    const consultations = useMemo(() => consultationsCol?.docs.map(d => ({id: d.id, ...d.data()} as Consultation)) || [], [consultationsCol]);

    const timeline = useMemo(() => {
        const combined = [
            ...healthRecords.map(r => ({ ...r, timelineType: r.type as string, sortDate: new Date(r.date) })),
            ...consultations.map(c => ({ ...c, timelineType: 'Consultation' as const, name: `Consultation with ${c.doctor}`, sortDate: new Date(c.date) }))
        ];
        return combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }, [healthRecords, consultations]);
    
    const isLoading = loadingAuth || loadingPatient || loadingRecords || loadingConsultations;

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }
  
  return (
    <div className="grid gap-6">
       <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-3xl font-bold">Welcome back, {patientDoc?.name?.split(' ')[0]}!</CardTitle>
            <CardDescription className="text-lg text-foreground/80 pt-1">
              This is your central hub. Review your timeline, manage access, and share your records securely.
            </CardDescription>
          </div>
          <ShareHistoryDialog />
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">My Health Timeline</TabsTrigger>
          <TabsTrigger value="access">Sharing & Access</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{healthRecords.length}</div>
                    <p className="text-xs text-muted-foreground">Total documents stored</p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Managed Access
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                    Providers with access (coming soon)
                    </p>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Access Logs</CardTitle>
                    <BookText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Total access events (coming soon)</p>
                </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
                <CardDescription>
                    A log of recent access to your health records.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Feature coming soon.
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Health Timeline</CardTitle>
                <CardDescription>
                  A unified, chronological view of your health records and consultations.
                </CardDescription>
              </div>
              <UploadDialog onRecordAdd={() => { /* re-fetch is handled by hooks */ }} />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {timeline.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className="bg-muted p-3 rounded-full">
                            {timelineIcons[item.timelineType]}
                          </div>
                          <div className="flex-1">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.timelineType === 'Consultation' ? 'Consultation' : item.type} &middot; {item.date}
                              </p>
                              { (item as Consultation).notes && <p className="text-sm mt-2">Notes: {(item as Consultation).notes}</p>}
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={(item as HealthRecord).url} target="_blank" rel="noopener noreferrer">
                              <ChevronRight className="h-5 w-5" />
                            </a>
                          </Button>
                      </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck /> Access Management</CardTitle>
                    <CardDescription>
                    Manage who has access to your health records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center text-muted-foreground py-8">
                        Feature coming soon.
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookText /> Access Log</CardTitle>
                    <CardDescription>
                    An audit trail of every access to your health records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Feature coming soon.
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
